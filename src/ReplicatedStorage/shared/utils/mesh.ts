import Object from '@rbxts/object-utils'
import { BLOCK_ATTRIBUTE } from 'ReplicatedStorage/shared/constants/core'
import {
  base58ColumnValues,
  decodeBase58Array,
  encodeBase58Array,
} from 'ReplicatedStorage/shared/utils/base58'
import { roundVector3 } from 'ReplicatedStorage/shared/utils/math'

export type EncodedMeshMidpoint = string
export type EncodedMeshData = string
export type MeshMap = Record<EncodedMeshMidpoint, EncodedMeshData>
export type MeshSet = Record<EncodedMeshMidpoint, boolean>

export type MeshStartpoint = Vector3 & { readonly _mesh_start?: unique symbol }
export type MeshEndpoint = Vector3 & { readonly _mesh_end?: unique symbol }
export type MeshMidpoint = Vector3 & { readonly _mesh_mid?: unique symbol }
export type MeshRotation = Vector3 & { readonly _mesh_rot?: unique symbol }

export interface MeshData {
  readonly blockId: number
  readonly size: Vector3
  readonly rotation: Vector3
}

export const gridSpacing = 3 // 1 voxel is 3x3x3 studs
export const coordinateEncodingLength = 2
export const maxCoordinateValue =
  base58ColumnValues[coordinateEncodingLength] - 1

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

export function getLowerCorner(position: Vector3, size: Vector3): Vector3 {
  return position.sub(size.div(2))
}

export function getUpperCorner(position: Vector3, size: Vector3): Vector3 {
  return position.add(size.div(2))
}

export function getPartLowerCorner(part: BasePart): Vector3 {
  return getLowerCorner(part.CFrame.Position, part.Size)
}

export function getMeshDataFromModel(model: Model): MeshData {
  const blockId = model.GetAttribute(BLOCK_ATTRIBUTE.BlockId)
  const size = model.PrimaryPart?.Size
  return {
    blockId: blockId && typeIs(blockId, 'number') ? blockId : 1,
    size: new Vector3(
      size ? math.floor(size.X / gridSpacing) : 1,
      size ? math.floor(size.Y / gridSpacing) : 1,
      size ? math.floor(size.Z / gridSpacing) : 1,
    ),
    rotation: new Vector3(0, 0, 0),
  }
}

export function getMeshMidpointFromWorldPosition(
  position: Vector3,
  baseplate: BasePart,
): MeshMidpoint {
  const baseplateCorner = getPartLowerCorner(baseplate).add(
    new Vector3(0, baseplate.Size.Y / 2, 0),
  )
  return position.sub(baseplateCorner).div(gridSpacing).Floor()
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

export function getMeshStartpointEndpointFromMidpointSize(
  midpoint: MeshMidpoint,
  unrotatedSize: Vector3,
  rotation: Vector3,
): {
  startpoint: MeshStartpoint
  endpoint: MeshEndpoint
} {
  const size = getRotatedMeshSize(unrotatedSize, rotation)
  const unquantizedMidpoint = midpoint.add(
    new Vector3(
      size.X % 2 ? 0.5 : 1,
      size.Y % 2 ? 0.5 : 1,
      size.Z % 2 ? 0.5 : 1,
    ),
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

export function getCFrameFromMeshMidpoint(
  midpoint: MeshMidpoint,
  size: Vector3,
  rotation: MeshRotation,
  baseplate: BasePart,
): CFrame {
  return baseplate.CFrame.ToWorldSpace(
    new CFrame(
      midpoint.X * gridSpacing -
        baseplate.Size.X / 2 +
        (size.X % 2 ? gridSpacing / 2 : 0),
      midpoint.Y * gridSpacing +
        baseplate.Size.Y / 2 +
        (size.Y % 2 ? gridSpacing / 2 : 0),
      midpoint.Z * gridSpacing -
        baseplate.Size.Z / 2 +
        (size.Z % 2 ? gridSpacing / 2 : 0),
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

export function expandMesh(
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

  for (let current = inputMidpoint, currentdir = -1; ; ) {
    if (dir === 'x') {
      current = new Vector3(
        current.X + (currentdir === -1 ? -inputData.size.X : inputData.size.X),
        current.Y,
        current.Z,
      )
    } else if (dir === 'y') {
      current = new Vector3(
        current.X,
        current.Y + (currentdir === -1 ? -inputData.size.Y : inputData.size.Y),
        current.Z,
      )
    } else if (dir === 'z') {
      current = new Vector3(
        current.X,
        current.Y,
        current.Z + (currentdir === -1 ? -inputData.size.Z : inputData.size.Z),
      )
    }

    const data = !meshSetGet(seen, current)
      ? meshMapGet(map, current)
      : undefined
    if (
      data &&
      data.size.X === inputData.size.X &&
      data.size.Y === inputData.size.Y &&
      data.size.Z === inputData.size.Z &&
      data.blockId === inputData.blockId
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

export function expandMeshes(map: MeshMap, dir: 'x' | 'y' | 'z') {
  const out: MeshMap = {}
  const seen: MeshSet = {}

  for (const [encodedMidpoint, encodedValue] of Object.entries(map)) {
    const inputMidpoint = decodeMeshMidpoint(encodedMidpoint)
    if (meshSetGet(seen, inputMidpoint)) continue
    meshSetAdd(seen, inputMidpoint)

    const { data, midpoint } = expandMesh(
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

export function runGreedyMeshing(parent: Instance, baseplate: BasePart) {
  const seen: MeshSet = {}
  const input: MeshMap = {}
  const inputMidpoint = getMeshMidpointFromWorldPosition(
    parent.GetChildren<BasePart>()[0].Position,
    baseplate,
  )
  let last: Vector3 | undefined
  let sp: Vector3 | undefined = inputMidpoint
  let ep = inputMidpoint
  let current = inputMidpoint

  for (const v of parent.GetChildren<Model>()) {
    const world = v.GetPivot()
    const midpoint = getMeshMidpointFromWorldPosition(world.Position, baseplate)
    const data = getMeshDataFromModel(v)
    meshMapAdd(input, midpoint, data)
    sp = sp.Min(midpoint)
    ep = ep.Max(midpoint)
  }

  const out: MeshMap = {}
  while (current.Z <= ep.Z) {
    while (current.X <= ep.X) {
      while (current.Y <= ep.Y) {
        const currentEncodedMidpoint = encodeMeshMidpoint(current)
        const currentData = meshMapGetEncoded(input, currentEncodedMidpoint)
        const currentSeen = meshSetGetEncoded(seen, currentEncodedMidpoint)
        const lastData = meshMapGet(input, last)
        if (
          lastData &&
          currentData &&
          currentSeen &&
          currentData !== lastData
        ) {
          if (!meshMapGet(input, last)) sp = current
          meshSetAddEncoded(seen, currentEncodedMidpoint)
        } else if (
          (!currentData || (lastData && lastData !== currentData)) &&
          meshMapGet(input, sp) &&
          sp &&
          last
        ) {
          const { midpoint, size } = getMeshMidpointSizeFromStartpointEndpoint(
            sp,
            last,
            lastData?.rotation ?? new Vector3(0, 0, 0),
          )
          meshMapAdd(out, midpoint, {
            ...lastData,
            blockId: lastData?.blockId ?? 1,
            rotation: lastData?.rotation ?? new Vector3(0, 0, 0),
            size,
          })
          if (lastData && currentData && lastData === currentData) sp = current
          else sp = undefined
        }
        last = current
        current = new Vector3(current.X, current.Y + 1, current.Z)
      }
      current = new Vector3(current.X + 1, inputMidpoint.Y, current.Z)
    }
    last = new Vector3(last?.X, last?.Y, current.Z)
    current = new Vector3(inputMidpoint.X, current.Y, current.Z + 1)
  }

  return expandMeshes(expandMeshes(out, 'x'), 'z')
}
