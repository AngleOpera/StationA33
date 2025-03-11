import Object from '@rbxts/object-utils'
import {
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

export function encodeMeshMidPoint(
  midpoint: MeshMidpoint,
): EncodedMeshMidpoint {
  return encodeBase58Array(
    [midpoint.X, midpoint.Y, midpoint.Z],
    coordinateEncodingLength,
  )
}

export function encodeMeshData(data: MeshData): EncodedMeshData {
  return encodeBase58Array(
    [data.blockId, data.width, data.length, data.height, data.rotation.Y],
    coordinateEncodingLength,
  )
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
  const baseplateCorner = getPartLowerCorner(baseplate)
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
      midpoint.Y * gridSpacing -
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

function dosmt(olnew: MeshMap, key: string, dir: string) {
  const o = decodeMeshMidPoint(key)
  const info = meshMapGetEncoded(olnew, key)

  const l = info?.length ?? 1
  const w = info?.width ?? 1
  const h = info?.height ?? 1
  const involved = new Set([key])
  let currentdir = -1
  let r = o

  let { startpoint: s, endpoint: e } =
    getMeshStartpointEndpointFromMidpointSize(
      o,
      new Vector3(info?.width, info?.height, info?.length),
      info?.rotation ?? new Vector3(0, 0, 0),
    )

  for (;;) {
    const goback = currentdir === -1
    if (dir === 'x') {
      r = new Vector3(r.X + (goback ? -l : l), r.Y, r.Z)
    } else if (dir === 'z') {
      r = new Vector3(r.X, r.Y, r.Z + (goback ? -w : w))
    } else if (dir === 'y') {
      r = new Vector3(r.X, r.Y + (goback ? -h : h), r.Z)
    }

    const c = meshMapGet(olnew, r)
    if (
      c &&
      c.width === w &&
      c.length === l &&
      c.height === h &&
      c.blockId === info?.blockId
    ) {
      const { startpoint, endpoint } =
        getMeshStartpointEndpointFromMidpointSize(
          r,
          new Vector3(c.width, c.height, c.length),
          c.rotation,
        )
      if (currentdir === -1) {
        s = startpoint
      } else {
        e = endpoint
      }
      involved.add(encodeMeshMidPoint(r))
    } else if (currentdir === -1) {
      currentdir = 1
      r = o
      continue
    } else {
      break
    }
  }

  const { midpoint, size } = getMeshMidpointSizeFromStartpointEndpoint(
    s,
    e,
    info?.rotation ?? new Vector3(0, 0, 0),
  )
  return {
    involved,
    midpoint,
    data: {
      blockId: info?.blockId ?? 1,
      width: size.X,
      length: size.Z,
      height: size.Y,
      rotation: info?.rotation ?? new Vector3(0, 0, 0),
    },
  }
}

function combineDimension(olnew: MeshMap, dir: string) {
  const cc: MeshMap = {}
  for (const key of Object.keys(olnew)) {
    if (!olnew[key]) continue
    const { involved, midpoint, data } = dosmt(olnew, key, dir)
    meshMapAdd(cc, midpoint, data)
    for (const v of Object.keys(involved)) {
      delete olnew[v]
    }
    return cc
  }
}

export function runGreedyMeshing(parent: Instance, baseplate: BasePart) {
  const D3: MeshMap = {}
  const checked: MeshSet = {}
  const mynew: MeshMap = {}

  const rand = parent.GetChildren<BasePart>()[0].Position
  let sp: Vector3 | undefined = rand
  let ep = rand
  let current = sp

  const ss = sp
  let last: Vector3 | undefined

  for (const v of parent.GetChildren<Model>()) {
    const world = v.GetPivot()
    const midpoint = getMeshMidpointFromWorldPosition(world.Position, baseplate)
    const data = getMeshDataFromModel(v)
    meshMapAdd(D3, midpoint, data)
    sp = sp.Min(midpoint)
    ep = ep.Max(midpoint)
  }

  while (current.Z <= ep.Z) {
    while (current.X <= ep.X) {
      while (current.Y <= ep.Y) {
        const currentEncodedMidpoint = encodeMeshMidPoint(current)
        const currentData = meshMapGetEncoded(D3, currentEncodedMidpoint)
        const currentChecked = meshSetGetEncoded(
          checked,
          currentEncodedMidpoint,
        )
        const lastData = meshMapGet(D3, last)

        if (
          lastData &&
          currentData &&
          currentChecked &&
          currentData !== lastData
        ) {
          if (!meshMapGet(D3, last)) {
            sp = current
          }
          meshSetAddEncoded(checked, currentEncodedMidpoint)
        } else if (
          (!currentData || (lastData && lastData !== currentData)) &&
          meshMapGet(D3, sp) &&
          sp &&
          last
        ) {
          const { midpoint, size } = getMeshMidpointSizeFromStartpointEndpoint(
            sp,
            last,
            lastData?.rotation ?? new Vector3(0, 0, 0),
          )
          meshMapAdd(mynew, midpoint, {
            ...lastData,
            blockId: lastData?.blockId ?? 1,
            width: size.X,
            length: size.Z,
            height: size.Y,
            rotation: lastData?.rotation ?? new Vector3(0, 0, 0),
          })

          if (lastData && currentData && lastData === currentData) {
            sp = current
          } else {
            sp = undefined
          }
        }
        last = current
        current = new Vector3(current.X, current.Y + 1, current.Z)
      }
      current = new Vector3(current.X + 1, ss.Y, current.Z)
    }
    last = new Vector3(last?.X, last?.Y, current.Z)
    current = new Vector3(ss.X, current.Y, current.Z + 1)
  }

  combineDimension(mynew, 'x')
  combineDimension(mynew, 'z')
}
