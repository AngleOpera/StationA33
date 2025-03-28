import Object from '@rbxts/object-utils'
import {
  BLOCK_ATTRIBUTE,
  InventoryItemDescription,
} from 'ReplicatedStorage/shared/constants/core'
import {
  base58ColumnValues,
  decodeBase58Array,
  encodeBase58Array,
} from 'ReplicatedStorage/shared/utils/base58'
import { getItemVector3 } from 'ReplicatedStorage/shared/utils/core'
import {
  getLowerCorner,
  getUpperCorner,
  roundVector3,
} from 'ReplicatedStorage/shared/utils/math'
import {
  compareString,
  sarrayAdd,
  sarrayRemove,
} from 'ReplicatedStorage/shared/utils/sarray'

export type EncodedMeshMidpoint = string
export type EncodedMeshData = string
export type MeshMap = Record<EncodedMeshMidpoint, EncodedMeshData>
export type MeshSet = Record<EncodedMeshMidpoint, boolean>
export type MeshOffsetMap = Record<EncodedMeshMidpoint, EncodedMeshMidpoint[]>

export type MeshStartpoint = Vector3 & { readonly _mesh_start?: unique symbol }
export type MeshEndpoint = Vector3 & { readonly _mesh_end?: unique symbol }
export type MeshMidpoint = Vector3 & { readonly _mesh_mid?: unique symbol }
export type MeshRotation = Vector3 & { readonly _mesh_rot?: unique symbol }

export interface MeshData {
  readonly blockId: number
  readonly size: Vector3
  readonly rotation: Vector3
}

export interface MeshPlot {
  mesh: MeshMap
  inputFrom: MeshOffsetMap
  inputTo: MeshOffsetMap
  outputTo: MeshOffsetMap
}

export const gridSpacing = 3 // 1 voxel is 3x3x3 studs
export const coordinateEncodingLength = 2
export const maxCoordinateValue =
  base58ColumnValues[coordinateEncodingLength] - 1

export const meshRotation0: MeshRotation = new Vector3(0, 0, 0)
export const meshRotation90: MeshRotation = new Vector3(0, 1, 0)
export const meshRotation180: MeshRotation = new Vector3(0, 2, 0)
export const meshRotation270: MeshRotation = new Vector3(0, 3, 0)

export function getMeshRotationName(rotation: MeshRotation): string {
  switch (rotation.Y) {
    case 0:
      return 'r0'
    case 1:
      return 'r90'
    case 2:
      return 'r180'
    case 3:
      return 'r270'
    default:
      return 'rerr'
  }
}

export function validMeshMidpoint(midpoint: Vector3): boolean {
  return (
    midpoint.X >= 0 &&
    midpoint.Y >= 0 &&
    midpoint.Z >= 0 &&
    midpoint.X <= maxCoordinateValue &&
    midpoint.Y <= maxCoordinateValue &&
    midpoint.Z <= maxCoordinateValue
  )
}

export function encodeMeshMidpoint(
  midpoint: MeshMidpoint,
): EncodedMeshMidpoint {
  return encodeBase58Array(
    [midpoint.X, midpoint.Y, midpoint.Z],
    coordinateEncodingLength,
  )
}

export function encodeMeshData(data: MeshData): EncodedMeshData {
  const needRotation = data.rotation.Y !== 0
  const needHeight = data.size.Y > 1 || needRotation
  const needLength = data.size.Z > 1 || needHeight
  const needWidth = data.size.X > 1 || needLength
  const components = [data.blockId]
  if (needWidth) components.push(data.size.X)
  if (needLength) components.push(data.size.Z)
  if (needHeight) components.push(data.size.Y)
  if (needRotation) components.push(data.rotation.Y)
  return encodeBase58Array(components, coordinateEncodingLength)
}

export function decodeMeshMidpoint(encoded: EncodedMeshMidpoint): MeshMidpoint {
  const decoded = decodeBase58Array(encoded, 3, coordinateEncodingLength)
  return new Vector3(decoded[0], decoded[1], decoded[2])
}

export function decodeMeshData(encoded: EncodedMeshData): MeshData {
  const decoded = decodeBase58Array(encoded, 5, coordinateEncodingLength)
  return {
    blockId: decoded[0],
    size: new Vector3(decoded[1] || 1, decoded[3] || 1, decoded[2] || 1),
    rotation: new Vector3(0, decoded[4] & 3, 0),
  }
}

export function getMeshDataFromModel(
  model: Model,
  baseplate?: BasePart,
): MeshData {
  const blockId = model.GetAttribute(BLOCK_ATTRIBUTE.BlockId)
  const size = model.PrimaryPart?.Size
  return {
    blockId: blockId && typeIs(blockId, 'number') ? blockId : 1,
    size: size ? size.div(gridSpacing).Floor() : new Vector3(1, 1, 1),
    rotation: baseplate
      ? getMeshRotationFromCFrame(model.GetPivot(), baseplate)
      : meshRotation0,
  }
}

export function getMeshMidpointFromWorldPosition(
  position: Vector3,
  baseplate: BasePart,
): MeshMidpoint {
  return baseplate.CFrame.ToObjectSpace(new CFrame(position))
    .add(baseplate.Size.div(2))
    .Position.div(gridSpacing)
    .Floor()
}

export function getMeshRotationFromCFrame(
  cframe: CFrame,
  baseplate: BasePart,
): MeshMidpoint {
  const [_x, y, _z] = baseplate.CFrame.ToObjectSpace(cframe).ToOrientation()
  const rotation = new Vector3(0, y > 0 ? y - math.rad(360) : y, 0).div(
    math.rad(-90),
  )
  const quantized = roundVector3(rotation)
  if (rotation.sub(quantized).Magnitude > 0.01) {
    throw `Invalid rotation ${cframe.ToOrientation()} for baseplate ${baseplate.CFrame.ToOrientation()}`
  }
  return new Vector3(0, quantized.Y % 4, 0)
}

export function getMeshMidpointSizeFromStartpointEndpoint(
  startpoint: MeshStartpoint,
  endpoint: MeshEndpoint,
  rotation: Vector3,
): { midpoint: MeshMidpoint; size: Vector3 } {
  const size = getRotatedMeshSize(
    endpoint
      .sub(startpoint)
      .Abs()
      .Floor()
      .add(new Vector3(1, 1, 1)),
    rotation,
  )
  return {
    midpoint: startpoint.add(endpoint).div(2).Floor(),
    size,
  }
}

export function getMeshUnquantizedMidpointFromMidpointRotatedSize(
  midpoint: MeshMidpoint,
  rotatedSize: Vector3,
) {
  return midpoint.add(
    new Vector3(
      rotatedSize.X % 2 ? 0.5 : 1,
      rotatedSize.Y % 2 ? 0.5 : 1,
      rotatedSize.Z % 2 ? 0.5 : 1,
    ),
  )
}

export function getMeshStartpointEndpointFromMidpointSize(
  midpoint: MeshMidpoint,
  unrotatedSize: Vector3,
  rotation: Vector3,
): {
  startpoint: MeshStartpoint
  endpoint: MeshEndpoint
} {
  const size = getRotatedMeshSize(unrotatedSize, rotation)
  const unquantizedMidpoint = getMeshUnquantizedMidpointFromMidpointRotatedSize(
    midpoint,
    size,
  )
  const lowerCorner = getLowerCorner(unquantizedMidpoint, size)
  const upperCorner = getUpperCorner(unquantizedMidpoint, size)
  const startpoint = lowerCorner.Floor()
  const endpoint = upperCorner.Floor()
  if (startpoint.sub(lowerCorner).Magnitude > 0.01) {
    throw `Invalid startPoint ${startpoint} for midpoint and size: ${midpoint}, ${size}`
  }
  if (endpoint.sub(upperCorner).Magnitude > 0.01) {
    throw `Invalid endPoint ${endpoint} for midpoint and size: ${midpoint}, ${size}`
  }
  return {
    startpoint,
    endpoint: endpoint.sub(new Vector3(1, 1, 1)),
  }
}

export function getMeshOffsetsFromMeshMidpoint(
  midpoint: MeshMidpoint,
  _unrotatedSize: Vector3,
  rotation: MeshRotation,
  offsets: ItemVector3[],
): MeshMidpoint[] {
  return offsets.map((offset) =>
    midpoint.add(getRotatedMeshPoint(getItemVector3(offset), rotation)).Floor(),
  )
}

export function getCFrameFromMeshMidpoint(
  midpoint: MeshMidpoint,
  unrotatedSize: Vector3,
  rotation: MeshRotation,
  baseplate: BasePart,
): CFrame {
  const size = getRotatedMeshSize(unrotatedSize, rotation)
  return baseplate.CFrame.ToWorldSpace(
    new CFrame(
      midpoint.X * gridSpacing -
        baseplate.Size.X / 2 +
        (size.X % 2 ? gridSpacing / 2 : gridSpacing),
      midpoint.Y * gridSpacing +
        baseplate.Size.Y / 2 +
        (size.Y % 2 ? gridSpacing / 2 : gridSpacing),
      midpoint.Z * gridSpacing -
        baseplate.Size.Z / 2 +
        (size.Z % 2 ? gridSpacing / 2 : gridSpacing),
    ).mul(CFrame.Angles(0, math.rad(90 * -rotation.Y), 0)),
  )
}

export function getRotatedMeshPoint(
  v: MeshStartpoint | MeshEndpoint | MeshMidpoint,
  rotation: MeshRotation,
) {
  if (!rotation.Y) return v
  const angle = math.rad(90 * rotation.Y)
  const sinAngle = math.sin(angle)
  const cosAngle = math.cos(angle)
  return new Vector3(
    math.round(v.X * cosAngle - v.Z * sinAngle),
    math.round(v.Y),
    math.round(v.X * sinAngle + v.Z * cosAngle),
  )
}

export function getRotatedMeshSize(
  size: Vector3,
  rotation: MeshRotation,
): Vector3 {
  return rotation.Y
    ? roundVector3(getRotatedMeshPoint(size, rotation).Abs())
    : size
}

export function meshMapAdd(
  map: MeshMap,
  midpoint: MeshMidpoint,
  data: MeshData,
): void {
  meshMapAddEncoded(map, encodeMeshMidpoint(midpoint), data)
}

export function meshMapAddEncoded(
  map: MeshMap,
  midpoint: EncodedMeshMidpoint,
  data: MeshData,
): void {
  map[midpoint] = encodeMeshData(data)
}

export function meshMapGet(
  map: MeshMap,
  midpoint?: MeshMidpoint,
): MeshData | undefined {
  return midpoint === undefined
    ? undefined
    : meshMapGetEncoded(map, encodeMeshMidpoint(midpoint))
}

export function meshMapGetEncoded(
  map: MeshMap,
  midpoint: EncodedMeshMidpoint,
): MeshData | undefined {
  const encoded = map[midpoint]
  return encoded !== undefined ? decodeMeshData(encoded) : undefined
}

export function meshMapRemoveEncoded(
  map: MeshMap,
  midpoint: EncodedMeshMidpoint,
): boolean {
  return delete map[midpoint]
}

export function meshSetAdd(map: MeshSet, midpoint: MeshMidpoint): void {
  meshSetAddEncoded(map, encodeMeshMidpoint(midpoint))
}

export function meshSetAddEncoded(map: MeshSet, midpoint: EncodedMeshMidpoint) {
  map[midpoint] = true
}

export function meshSetGet(map: MeshSet, midpoint?: MeshMidpoint): boolean {
  return midpoint === undefined
    ? false
    : meshSetGetEncoded(map, encodeMeshMidpoint(midpoint))
}

export function meshSetGetEncoded(map: MeshSet, midpoint: EncodedMeshMidpoint) {
  return !!map[midpoint]
}

export function meshOffsetMapAdd(
  map: MeshOffsetMap,
  offsetMidpoint: MeshMidpoint,
  encodedParentMidpoint: EncodedMeshMidpoint,
) {
  const encodedOffsetMidpoint = encodeMeshMidpoint(offsetMidpoint)
  let blockOffsets = map[encodedOffsetMidpoint]
  if (!blockOffsets) {
    blockOffsets = []
    map[encodedOffsetMidpoint] = blockOffsets
  }
  sarrayAdd(blockOffsets, encodedParentMidpoint, compareString)
}

export function meshOffsetMapRemove(
  map: MeshOffsetMap,
  offsetMidpoint: MeshMidpoint,
  encodedParentMidpoint: EncodedMeshMidpoint,
) {
  const encodedOffsetMidpoint = encodeMeshMidpoint(offsetMidpoint)
  const blockOffsets = map[encodedOffsetMidpoint]
  if (!blockOffsets) return
  sarrayRemove(blockOffsets, encodedParentMidpoint, compareString)
  if (blockOffsets.size() === 0) delete map[encodedOffsetMidpoint]
}

export function meshOffsetMapGet(
  map: MeshOffsetMap,
  offsetMidpoint: MeshMidpoint,
): EncodedMeshMidpoint[] {
  return map[encodeMeshMidpoint(offsetMidpoint)] ?? []
}

export function visitMeshOffsets(
  plot: MeshPlot,
  midpoint: MeshMidpoint,
  encodedMidpoint: EncodedMeshMidpoint,
  item: InventoryItemDescription,
  rotation: MeshRotation,
  visit = meshOffsetMapAdd,
) {
  const size = getItemVector3(item.size)
  for (const input of item.inputFrom
    ? getMeshOffsetsFromMeshMidpoint(midpoint, size, rotation, item.inputFrom)
    : []) {
    if (validMeshMidpoint(input)) visit(plot.inputFrom, input, encodedMidpoint)
  }
  if (item.inputTo) {
    for (const input of getMeshOffsetsFromMeshMidpoint(
      midpoint,
      size,
      rotation,
      item.inputTo,
    )) {
      if (validMeshMidpoint(input)) visit(plot.inputTo, input, encodedMidpoint)
    }
  } else if (item.inputFrom) {
    // Default to mesh midpoint if inputFrom without inputTo
    visit(plot.inputTo, midpoint, encodedMidpoint)
  }
  for (const output of item.outputTo
    ? getMeshOffsetsFromMeshMidpoint(midpoint, size, rotation, item.outputTo)
    : []) {
    if (validMeshMidpoint(output)) visit(plot.outputTo, output, encodedMidpoint)
  }
}

export function meshPlotAdd(
  plot: MeshPlot,
  midpoint: MeshMidpoint,
  item: InventoryItemDescription,
  rotation: MeshRotation,
): EncodedMeshMidpoint {
  const encodedMidpoint = encodeMeshMidpoint(midpoint)
  const size = getItemVector3(item.size)
  meshMapAddEncoded(plot.mesh, encodedMidpoint, {
    ...item,
    rotation,
    size,
  })
  visitMeshOffsets(
    plot,
    midpoint,
    encodedMidpoint,
    item,
    rotation,
    meshOffsetMapAdd,
  )
  return encodedMidpoint
}

export function meshPlotRemove(
  plot: MeshPlot,
  midpoint: MeshMidpoint,
  item: InventoryItemDescription,
  rotation: MeshRotation,
): void {
  const encodedMidpoint = encodeMeshMidpoint(midpoint)
  meshMapRemoveEncoded(plot.mesh, encodedMidpoint)
  visitMeshOffsets(
    plot,
    midpoint,
    encodedMidpoint,
    item,
    rotation,
    meshOffsetMapRemove,
  )
}

export function doGreedyMeshingFromPoint(
  map: MeshMap,
  seen: MeshSet,
  inputMidpoint: MeshMidpoint,
  inputData: MeshData,
  dir: 'x' | 'y' | 'z',
): { data: MeshData; midpoint: MeshMidpoint } {
  let { startpoint: sp, endpoint: ep } =
    getMeshStartpointEndpointFromMidpointSize(
      inputMidpoint,
      inputData.size,
      inputData.rotation,
    )
  let step = new Vector3(
    dir === 'x' ? -inputData.size.X : 0,
    dir === 'y' ? -inputData.size.Y : 0,
    dir === 'z' ? -inputData.size.Z : 0,
  )

  for (let current = inputMidpoint, currentdir = -1; ; ) {
    current = current.add(step)

    const data = !meshSetGet(seen, current)
      ? meshMapGet(map, current)
      : undefined
    if (
      data &&
      data.blockId === inputData.blockId &&
      data.size.X === inputData.size.X &&
      data.size.Y === inputData.size.Y &&
      data.size.Z === inputData.size.Z
    ) {
      const { startpoint, endpoint } =
        getMeshStartpointEndpointFromMidpointSize(
          current,
          data.size,
          data.rotation,
        )
      if (currentdir === -1) sp = startpoint
      else ep = endpoint
      meshSetAdd(seen, current)
    } else if (currentdir === -1) {
      currentdir = 1
      current = inputMidpoint
      step = step.mul(-1)
      continue
    } else {
      break
    }
  }

  const { midpoint, size } = getMeshMidpointSizeFromStartpointEndpoint(
    sp,
    ep,
    inputData.rotation,
  )
  return {
    data: {
      blockId: inputData.blockId,
      rotation: inputData.rotation,
      size,
    },
    midpoint,
  }
}

export function doGreedyMeshing(map: MeshMap, dir: 'x' | 'y' | 'z') {
  const out: MeshMap = {}
  const seen: MeshSet = {}

  for (const [encodedMidpoint, encodedValue] of Object.entries(map)) {
    const inputMidpoint = decodeMeshMidpoint(encodedMidpoint)
    if (meshSetGet(seen, inputMidpoint)) continue
    meshSetAdd(seen, inputMidpoint)

    const { data, midpoint } = doGreedyMeshingFromPoint(
      map,
      seen,
      inputMidpoint,
      decodeMeshData(encodedValue),
      dir,
    )
    meshMapAdd(out, midpoint, data)
  }
  return out
}
