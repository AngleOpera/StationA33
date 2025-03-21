import {
  BLOCK_ATTRIBUTE,
  BLOCK_ID_LOOKUP,
} from 'ReplicatedStorage/shared/constants/core'

export const getItemVector3 = (v: ItemVector3) => new Vector3(v[0], v[1], v[2])

export const getItemFromBlock = (block: Model) => {
  const blockId = block.GetAttribute(BLOCK_ATTRIBUTE.BlockId)
  return blockId && typeIs(blockId, 'number')
    ? BLOCK_ID_LOOKUP[blockId]
    : undefined
}
