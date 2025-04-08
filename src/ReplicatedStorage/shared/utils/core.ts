import { Dependency } from '@flamework/core'
import { Logger } from '@rbxts/log'
import {
  BLOCK_ATTRIBUTE,
  BLOCK_ID_LOOKUP,
  InventoryItemDescription,
  Step,
} from 'ReplicatedStorage/shared/constants/core'
import { roundVector3 } from 'ReplicatedStorage/shared/utils/math'

export type EncodedEntityStep = [number, number] & {
  readonly _entity_step?: unique symbol
}

export type EncodedOffsetStep = number & {
  readonly _mesh_offset_step?: unique symbol
}

export type Rotation = Vector3 & { readonly _rotation?: unique symbol }

export const rotation0: Rotation = new Vector3(0, 0, 0)
export const rotation90: Rotation = new Vector3(0, 1, 0)
export const rotation180: Rotation = new Vector3(0, 2, 0)
export const rotation270: Rotation = new Vector3(0, 3, 0)

export const rotations = [rotation0, rotation90, rotation180, rotation270]

const surfaceRotationSequence = {
  Y: [
    Enum.NormalId.Front,
    Enum.NormalId.Left,
    Enum.NormalId.Back,
    Enum.NormalId.Right,
  ],
}

let logger: Logger

export function getLogger() {
  if (!logger) logger = Dependency<Logger>()
  return logger
}

export function isRotation180or270(rotation: Rotation) {
  return rotation.Y === 2 || rotation.Y === 3
}

export function getRotationName(rotation: Rotation): string {
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

export function getRotatedPoint(v: Vector3, rotation: Rotation) {
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

export function getRotatedSurface(
  surface: Enum.NormalId,
  rotation: Rotation,
): Enum.NormalId {
  switch (surface) {
    case Enum.NormalId.Front:
    case Enum.NormalId.Left:
    case Enum.NormalId.Back:
    case Enum.NormalId.Right:
      return surfaceRotationSequence.Y[
        (surfaceRotationSequence.Y.indexOf(surface) + rotation.Y) %
          surfaceRotationSequence.Y.size()
      ]
    default:
      return surface
  }
}

export function getRotatedSize(size: Vector3, rotation: Rotation): Vector3 {
  return rotation.Y ? roundVector3(getRotatedPoint(size, rotation).Abs()) : size
}

export function getStepVector(step: Step) {
  switch (step) {
    case Step.Forward:
      return new Vector3(0, 0, -1)
    case Step.Right:
      return new Vector3(1, 0, 0)
    case Step.Backward:
      return new Vector3(0, 0, 1)
    case Step.Left:
      return new Vector3(-1, 0, 0)
  }
}

export function getStepFromVector(v: Vector3) {
  const normalized = v.Unit
  if (normalized.FuzzyEq(new Vector3(0, 0, -1))) return Step.Forward
  if (normalized.FuzzyEq(new Vector3(1, 0, 0))) return Step.Right
  if (normalized.FuzzyEq(new Vector3(0, 0, 1))) return Step.Backward
  if (normalized.FuzzyEq(new Vector3(-1, 0, 0))) return Step.Left
  return undefined
}

export function encodeOffsetStep(offset: Vector3, step: Step) {
  const { X, Y, Z } = offset.Abs().Floor()
  return (
    (offset.X < 0 ? 1 << 22 : 0) |
    (offset.Y < 0 ? 1 << 21 : 0) |
    (offset.Z < 0 ? 1 << 20 : 0) |
    ((X & 0b111111) << 14) |
    ((Y & 0b111111) << 8) |
    ((Z & 0b111111) << 2) |
    step
  )
}

export function decodeOffsetStep(encoded: EncodedOffsetStep) {
  const sx = (encoded >> 22) & 1
  const sy = (encoded >> 21) & 1
  const sz = (encoded >> 20) & 1
  const x = (encoded >> 14) & 0b111111
  const y = (encoded >> 8) & 0b111111
  const z = (encoded >> 2) & 0b111111
  const step = encoded & 0b11
  return { offset: new Vector3(sx ? -x : x, sy ? -y : y, sz ? -z : z), step }
}

export function encodeEntityStep(
  entity: number,
  step: Step,
): EncodedEntityStep {
  return [entity, step]
}

export function decodeEntityStep(encoded: EncodedEntityStep): {
  entity: number
  step: Step
} {
  return {
    entity: encoded[0],
    step: encoded[1],
  }
}

export function getOffsetStep(from: Vector3, to: Vector3, rotation: Rotation) {
  const offset = getRotatedPoint(from, rotation).Floor()
  const step = getStepFromVector(getRotatedPoint(to, rotation).sub(offset)) ?? 0
  return { offset, step }
}

export function getOffsetsFromMidpoint(
  midpoint: Vector3,
  rotation: Rotation,
  offsets: ItemVector3[],
): Vector3[] {
  return offsets.map((offset) =>
    midpoint.add(getRotatedPoint(getItemVector3(offset), rotation)).Floor(),
  )
}

export function findOffsetIndexFromMidpointAndOffsetPoint(
  itemOffsets: ItemVector3[],
  midpoint: Vector3,
  offsetPoint: Vector3,
  rotation: Rotation,
) {
  const offsets = getOffsetsFromMidpoint(midpoint, rotation, itemOffsets)
  for (let i = 0; i < offsets.size(); i++) {
    const offset = offsets[i]
    if (offset.FuzzyEq(offsetPoint)) return i
  }
  return -1
}

export const getItemVector3 = (v: ItemVector3) => new Vector3(v[0], v[1], v[2])

export const getItemVector3WithDefault = (v?: ItemVector3) =>
  v ? getItemVector3(v) : new Vector3(0, 0, 0)

export const getItemFromBlock = (block?: Model) => {
  const blockId = block?.GetAttribute(BLOCK_ATTRIBUTE.BlockId)
  return blockId && typeIs(blockId, 'number')
    ? BLOCK_ID_LOOKUP[blockId]
    : undefined
}

export function getItemInputToOffsets(
  item: InventoryItemDescription,
): ItemVector3[] | undefined {
  return item.inputTo ?? (item.inputFrom ? [[0, 0, 0]] : undefined)
}

export function getItemInputOffsetStep(
  item: InventoryItemDescription,
  rotation: Rotation,
  index: number,
) {
  return getOffsetStep(
    getItemVector3WithDefault(item.inputFrom?.[index]),
    getItemVector3WithDefault(item.inputTo?.[index]),
    rotation,
  )
}

export function getItemOutputOffsetStep(
  item: InventoryItemDescription,
  rotation: Rotation,
  index: number,
) {
  return getOffsetStep(
    getItemVector3WithDefault(item.outputFrom?.[index]),
    getItemVector3WithDefault(item.outputTo?.[index]),
    rotation,
  )
}
