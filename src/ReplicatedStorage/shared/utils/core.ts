import { Dependency } from '@flamework/core'
import { Logger } from '@rbxts/log'
import {
  BLOCK_ATTRIBUTE,
  BLOCK_ID_LOOKUP,
  InventoryItemDescription,
  Step,
} from 'ReplicatedStorage/shared/constants/core'

export type EncodedEntityStep = number & {
  readonly _entity_step?: unique symbol
}

let logger: Logger

export function getLogger() {
  if (!logger) logger = Dependency<Logger>()
  return logger
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

export function getEncodedEntityStep(
  entity: number,
  step: Step,
): EncodedEntityStep {
  return (entity << 2) | step
}

export function getEntityStepFromEncodedStep(encoded: EncodedEntityStep): {
  entity: number
  step: Step
} {
  return {
    entity: encoded >> 2,
    step: encoded & 0b11,
  }
}

export const getItemVector3 = (v: ItemVector3) => new Vector3(v[0], v[1], v[2])

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
