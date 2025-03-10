import Object from '@rbxts/object-utils'
import { Workspace } from '@rbxts/services'
import {
  decodeBase58Array,
  encodeBase58Array,
} from 'ReplicatedStorage/shared/utils/base58'

export type EncodedMeshMidpoint = string
export type EncodedMeshData = string
export type MeshMap = Record<EncodedMeshMidpoint, EncodedMeshData>

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

export function getMeshMidpointFromWorldPosition(
  position: Vector3,
  baseplate: BasePart,
): MeshMidpoint {
  const baseplateCorner = getPartLowerCorner(baseplate)
  return position.sub(baseplateCorner).div(gridSpacing).Floor()
}

export function getMeshMidpointSizeFromStartpointEndpoint(
  startPoint: MeshStartpoint,
  endPoint: MeshEndpoint,
  _rotation: Vector3,
): { midpoint: MeshMidpoint; size: Vector3 } {
  return {
    midpoint: startPoint.add(endPoint).div(2).Floor(),
    size: endPoint.sub(startPoint).Abs().Floor(),
  }
}

export function getMeshStartpointEndpointFromMidpointSize(
  midpoint: MeshMidpoint,
  size: Vector3,
  _rotation: Vector3,
): {
  startPoint: MeshStartpoint
  endPoint: MeshEndpoint
} {
  const unquantizedMidpoint = new Vector3(
    midpoint.X + (size.X % 2 ? 0.5 : 0),
    midpoint.Y + (size.Y % 2 ? 0.5 : 0),
    midpoint.Z + (size.Z % 2 ? 0.5 : 0),
  )
  const lowerCorner = getLowerCorner(unquantizedMidpoint, size)
  const upperCorner = getUpperCorner(unquantizedMidpoint, size)
  const startPoint = lowerCorner.Floor()
  const endPoint = upperCorner.Floor()
  if (startPoint.sub(lowerCorner).Magnitude > 0.01) {
    throw `Invalid startPoint ${startPoint} for midpoint and size: ${midpoint}, ${size}`
  }
  if (endPoint.sub(upperCorner).Magnitude > 0.01) {
    throw `Invalid endPoint ${endPoint} for midpoint and size: ${midpoint}, ${size}`
  }
  return { startPoint, endPoint }
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

export interface GreedyMeshData {
  name: string
  startx: number
  endx: number
  startz: number
  endz: number
  starty: number
  endy: number
  h: number
  l: number
  w: number
  real: Vector3
}

export type GreedyMeshDataTable = Record<
  number,
  Record<number, Record<number, GreedyMeshData>>
>

export class GreedyMeshing {
  constructor(
    public TargetFolder: Folder,
    public OutputFolderName: string,
  ) {}

  D3: GreedyMeshDataTable = {}
  olnew: Record<string, GreedyMeshData> = {}

  static decombine(str: string) {
    return str.split(',')
  }

  static findInTable<X>(
    tab: Record<number, Record<number, Record<number, X>>>,
    x: number | undefined,
    y: number | undefined,
    z: number | undefined,
  ) {
    return x !== undefined && y !== undefined && z !== undefined
      ? tab[x] && tab[x][y] && tab[x][y][z]
      : undefined
  }

  static addToTable<X>(
    tab: Record<number, Record<number, Record<number, X>>>,
    data: X,
    x: number,
    y: number,
    z: number,
  ) {
    tab[x] = tab[x] || {}
    tab[x][y] = tab[x][y] || {}
    tab[x][y][z] = data
  }

  static createBlock(
    sx: number,
    ex: number,
    sz: number,
    ez: number,
    sy: number,
    ey: number,
    name: string | undefined,
  ): GreedyMeshData {
    const l = math.sqrt(math.pow(sx - ex, 2))
    const h = math.sqrt(math.pow(sy - ey, 2))
    const w = math.sqrt(math.pow(sz - ez, 2))
    const midpointx = (sx + ex) / 2
    const midpointy = (sy + ey) / 2
    const midpointz = (sz + ez) / 2

    return {
      name: name ?? '',
      startx: sx,
      endx: ex,
      startz: sz,
      endz: ez,
      starty: sy,
      endy: ey,
      h,
      l,
      w,
      real: new Vector3(midpointx, midpointy, midpointz),
    }
  }

  compare(
    x: number | undefined,
    y: number | undefined,
    z: number | undefined,
    xx: number,
    yy: number,
    zz: number,
  ) {
    const d1 =
      x !== undefined && y !== undefined && z !== undefined
        ? GreedyMeshing.findInTable(this.D3, x, y, z)
        : undefined
    const d2 = GreedyMeshing.findInTable(this.D3, xx, yy, zz)
    return !(d1 && d2 && d1 !== d2)
  }

  dosmt(key: string, dir: string) {
    const [ox, oy, oz] = GreedyMeshing.decombine(key)
    const info = this.olnew[key]
    let rx = ox
    let ry = oy
    let rz = oz
    let sx = info.startx
    let ex = info.endx
    let sz = info.startz
    let ez = info.endz
    let sy = info.starty
    let ey = info.endy
    const l = info.l
    const w = info.w
    const h = info.h

    const involved = new Set([key])

    function move(goback: boolean) {
      if (dir === 'x') {
        rx = rx + (goback ? -l : l)
      } else if (dir === 'z') {
        rz = rz + (goback ? -w : w)
      } else if (dir === 'y') {
        ry = ry + (goback ? -h : h)
      }
    }

    let currentdir = -1
    for (;;) {
      move(currentdir === -1)
      const c = this.olnew[`${rx},${ry},${rz}`]
      if (c && c.w === w && c.l === l && c.h === h && c.name === info.name) {
        if (currentdir === -1) {
          sx = c.startx
          sy = c.starty
          sz = c.startz
        } else {
          ex = c.endx
          ey = c.endy
          ez = c.endz
        }
        involved.add(`${rx},${ry},${rz}`)
      } else if (currentdir === -1) {
        currentdir = 1
        rx = ox
        ry = oy
        rz = oz
        continue
      } else {
        break
      }
    }
    return {
      involved,
      data: GreedyMeshing.createBlock(sx, ex, sz, ez, sy, ey, info.name),
    }
  }

  combineDimension(dir: string) {
    const cc: Record<string, GreedyMeshData> = {}
    for (const key of Object.keys(this.olnew)) {
      if (!this.olnew[key]) continue
      const { involved, data } = this.dosmt(key, dir)
      const newkey = `${data.real.X},${data.starty},${data.startz}`
      cc[newkey] = data
      for (const v of Object.keys(involved)) {
        delete this.olnew[v]
      }
    }
    this.olnew = cc
  }

  visualizeBlocks() {
    const folder = new Instance('Folder', Workspace)
    folder.Name = this.OutputFolderName || '3D Done'

    for (const v of Object.values(this.olnew)) {
      const sx = v.startx
      const ex = v.endx

      let l = 0
      let w = 0
      let h = 0

      l = math.sqrt((sx - ex) ^ 2) + (l !== -1 ? 4 : 0)
      const sz = v.startz + 150
      const ez = v.endz + 150

      w = math.sqrt((sz - ez) ^ 2) + (w !== -1 ? 4 : 0)
      const sy = v.starty
      const ey = v.endy

      h = math.sqrt((sy - ey) ^ 2) + (h !== -1 ? 4 : 0)
      const midpointx = (sx + ex) / 2
      const midpointz = (sz + ez) / 2
      const midpointy = (sy + ey) / 2

      const c = new Instance('Part')
      c.Size = new Vector3(l, h, w)
      c.Position = new Vector3(midpointx, midpointy, midpointz)
      c.Anchored = true
      c.Parent = folder
      c.BrickColor = BrickColor.random()
      c.Material = Enum.Material.SmoothPlastic
      c.Name = v.name
    }
  }

  meshGreedily() {
    const D3: Record<number, Record<number, Record<number, string>>> = {}
    const checked: Record<number, Record<number, Record<number, boolean>>> = {}
    const mynew: Record<string, GreedyMeshData> = {}

    const rand = this.TargetFolder.GetChildren<BasePart>()[0].Position

    let old = 0
    let startx: number | undefined = rand.X
    let starty: number | undefined = rand.Y
    let startz: number | undefined = rand.Z
    let endx = rand.X
    let endy = rand.Y
    let endz = rand.Z

    let currentx = startx
    let currenty = starty
    let currentz = startz
    const ssx = startx
    const ssy = starty
    let lastx, lastz, lasty

    for (const v of this.TargetFolder.GetChildren<BasePart>()) {
      old = old + 1
      D3[v.Position.X] = D3[v.Position.X] || {}
      D3[v.Position.X][v.Position.Y] = D3[v.Position.X][v.Position.Y] || {}
      D3[v.Position.X][v.Position.Y][v.Position.Z] = v.Name
      v.BrickColor = BrickColor.random()

      if (v.Position.X >= endx) {
        endx = v.Position.X
      }
      if (v.Position.Z >= endz) {
        endz = v.Position.Z
      }
      if (v.Position.Y >= endy) {
        endy = v.Position.Y
      }
      if (v.Position.X <= startx) {
        startx = v.Position.X
      }
      if (v.Position.Z <= startz) {
        startz = v.Position.Z
      }
      if (v.Position.Y <= starty) {
        starty = v.Position.Y
      }
    }

    while (currentz <= endz + 4) {
      while (currentx <= endx + 4) {
        while (currenty <= endy + 4) {
          if (
            GreedyMeshing.findInTable(D3, currentx, currenty, currentz) &&
            !GreedyMeshing.findInTable(checked, currentx, currenty, currentz) &&
            this.compare(lastx, lasty, lastz, currentx, currenty, currentz)
          ) {
            if (!GreedyMeshing.findInTable(D3, lastx, lasty, lastz)) {
              startx = currentx
              starty = currenty
              startz = currentz
            }
            GreedyMeshing.addToTable(
              checked,
              true,
              currentx,
              currenty,
              currentz,
            )
          } else if (
            (!GreedyMeshing.findInTable(D3, currentx, currenty, currentz) ||
              !this.compare(
                lastx,
                lasty,
                lastz,
                currentx,
                currenty,
                currentz,
              )) &&
            GreedyMeshing.findInTable(D3, startx, starty, startz) &&
            startx &&
            startz &&
            starty &&
            lastx &&
            lastz &&
            lasty
          ) {
            const data = GreedyMeshing.createBlock(
              startx,
              lastx,
              startz,
              lastz,
              starty,
              lasty,
              GreedyMeshing.findInTable(D3, lastx, lasty, lastz),
            )

            const index = `${data.real.X},${data.starty},${data.startz}`
            mynew[index] = data
            if (
              !this.compare(lastx, lasty, lastz, currentx, currenty, currentz)
            ) {
              startx = currentx
              starty = currenty
              startz = currentz
            } else {
              startx = undefined
              starty = undefined
              startz = undefined
            }
          }
          lastx = currentx
          lasty = currenty
          lastz = currentz
          currenty = currenty + 4
        }
        currenty = ssy
        currentx = currentx + 4
      }
      currentx = ssx
      lastz = currentz
      currentz = currentz + 4
    }

    this.combineDimension('x')
    this.combineDimension('z')
    this.visualizeBlocks()

    /*
     workspace:WaitForChild(OutputFolderName).ChildAdded:Connect(function()
              if #workspace:FindFirstChild(OutputFolderName):GetChildren() == #TargetFolder:GetChildren() then
  */
  }
}
