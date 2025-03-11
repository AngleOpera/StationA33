import Object from '@rbxts/object-utils'
import {
  base58ColumnValues,
  decodeBase58Array,
  encodeBase58Array,
} from 'ReplicatedStorage/shared/utils/base58'

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
  readonly width: number
  readonly length: number
  readonly height: number
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

export function encodeMeshMidPoint(
  midpoint: MeshMidpoint,
): EncodedMeshMidpoint {
  return encodeBase58Array(
    [midpoint.X, midpoint.Y, midpoint.Z],
    coordinateEncodingLength,
  )
}

export function encodeMeshData(data: MeshData): EncodedMeshData {
  const needRotation = data.rotation.Y !== 0
  const needHeight = data.height > 1 || needRotation
  const needLength = data.length > 1 || needHeight
  const needWidth = data.width > 1 || needLength
  const components = [data.blockId]
  if (needWidth) components.push(data.width)
  if (needLength) components.push(data.length)
  if (needWidth) components.push(data.height)
  if (needRotation) components.push(data.rotation.Y)
  return encodeBase58Array(components, coordinateEncodingLength)
}

export function decodeMeshMidPoint(encoded: EncodedMeshMidpoint): MeshMidpoint {
  const decoded = decodeBase58Array(encoded, 3, coordinateEncodingLength)
  return new Vector3(decoded[0], decoded[1], decoded[2])
}

export function decodeMeshData(encoded: EncodedMeshData): MeshData {
  const decoded = decodeBase58Array(encoded, 5, coordinateEncodingLength)
  return {
    blockId: decoded[0],
    width: decoded[1] || 1,
    length: decoded[2] || 1,
    height: decoded[3] || 1,
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
  const size = model.PrimaryPart?.Size
  return {
    blockId: 1,
    width: size ? math.floor(size.X / gridSpacing) : 1,
    length: size ? math.floor(size.Z / gridSpacing) : 1,
    height: size ? math.floor(size.Y / gridSpacing) : 1,
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
  _rotation: Vector3,
): { midpoint: MeshMidpoint; size: Vector3 } {
  return {
    midpoint: startpoint.add(endpoint).div(2).Floor(),
    size: endpoint.sub(startpoint).Abs().Floor(),
  }
}

export function getMeshStartpointEndpointFromMidpointSize(
  midpoint: MeshMidpoint,
  size: Vector3,
  _rotation: Vector3,
): {
  startpoint: MeshStartpoint
  endpoint: MeshEndpoint
} {
  const unquantizedMidpoint = new Vector3(
    midpoint.X + (size.X % 2 ? 0.5 : 0),
    midpoint.Y + (size.Y % 2 ? 0.5 : 0),
    midpoint.Z + (size.Z % 2 ? 0.5 : 0),
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
  return { startpoint, endpoint }
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
    ).mul(CFrame.Angles(0, math.rad(90 * rotation.Y), 0)),
  )
}

export function meshMapAdd(
  map: MeshMap,
  midpoint: MeshMidpoint,
  data: MeshData,
): void {
  meshMapAddEncoded(map, encodeMeshMidPoint(midpoint), data)
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
    : meshMapGetEncoded(map, encodeMeshMidPoint(midpoint))
}

export function meshMapGetEncoded(
  map: MeshMap,
  midpoint: EncodedMeshMidpoint,
): MeshData | undefined {
  const encoded = map[midpoint]
  return encoded !== undefined ? decodeMeshData(encoded) : undefined
}

export function meshSetAdd(map: MeshSet, midpoint: MeshMidpoint): void {
  meshSetAddEncoded(map, encodeMeshMidPoint(midpoint))
}

export function meshSetAddEncoded(map: MeshSet, midpoint: EncodedMeshMidpoint) {
  map[midpoint] = true
}

export function meshSetGet(map: MeshSet, midpoint?: MeshMidpoint): boolean {
  return midpoint === undefined
    ? false
    : meshSetGetEncoded(map, encodeMeshMidPoint(midpoint))
}

export function meshSetGetEncoded(map: MeshSet, midpoint: EncodedMeshMidpoint) {
  return !!map[midpoint]
}

export function expandMesh(
  map: MeshMap,
  inputEncodedMidpoint: EncodedMeshMidpoint,
  inputData: MeshData,
  dir: 'x' | 'y' | 'z',
) {
  const included: MeshSet = { [inputEncodedMidpoint]: true }
  const inputMidpoint = decodeMeshMidPoint(inputEncodedMidpoint)
  let currentdir = -1
  let { startpoint: sp, endpoint: ep } =
    getMeshStartpointEndpointFromMidpointSize(
      inputMidpoint,
      new Vector3(inputData.width, inputData.height, inputData.length),
      inputData.rotation,
    )

  for (let current = inputMidpoint; ; ) {
    if (dir === 'x') {
      current = new Vector3(
        current.X + (currentdir === -1 ? -inputData.width : inputData.width),
        current.Y,
        current.Z,
      )
    } else if (dir === 'y') {
      current = new Vector3(
        current.X,
        current.Y + (currentdir === -1 ? -inputData.height : inputData.height),
        current.Z,
      )
    } else if (dir === 'z') {
      current = new Vector3(
        current.X,
        current.Y,
        current.Z + (currentdir === -1 ? -inputData.length : inputData.length),
      )
    }
    const data = meshMapGet(map, current)
    if (
      data &&
      data.width === inputData.width &&
      data.length === inputData.length &&
      data.height === inputData.height &&
      data.blockId === inputData.blockId
    ) {
      const { startpoint, endpoint } =
        getMeshStartpointEndpointFromMidpointSize(
          current,
          new Vector3(data.width, data.height, data.length),
          data.rotation,
        )
      if (currentdir === -1) sp = startpoint
      else ep = endpoint
      meshSetAdd(included, current)
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
      width: size.X,
      length: size.Z,
      height: size.Y,
      rotation: inputData.rotation,
    },
    included,
    midpoint,
  }
}

function expandMeshes(map: MeshMap, dir: 'x' | 'y' | 'z') {
  const out: MeshMap = {}
  for (const [key, value] of Object.entries(map)) {
    const { data, included, midpoint } = expandMesh(
      map,
      key,
      decodeMeshData(value),
      dir,
    )
    meshMapAdd(out, midpoint, data)
    for (const v of Object.keys(included)) delete map[v]
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
        const currentEncodedMidpoint = encodeMeshMidPoint(current)
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
            width: size.X,
            length: size.Z,
            height: size.Y,
            rotation: lastData?.rotation ?? new Vector3(0, 0, 0),
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
