import { Workspace } from '@rbxts/services'
import {
  BLOCK_ATTRIBUTE,
  BLOCK_ID_LOOKUP,
} from 'ReplicatedStorage/shared/constants/core'
import { findPathToDescendent } from 'ReplicatedStorage/shared/utils/instance'

export const getItemVector3 = (v: ItemVector3) => new Vector3(v[0], v[1], v[2])

export const getItemFromBlock = (block: Model) => {
  const blockId = block.GetAttribute(BLOCK_ATTRIBUTE.BlockId)
  return blockId && typeIs(blockId, 'number')
    ? BLOCK_ID_LOOKUP[blockId]
    : undefined
}

export function findPlacedBlockFromDescendent(descendent: Instance) {
  const path = findPathToDescendent(Workspace.PlayerSpaces, descendent)
  if (!path || path.size() < 3 || path[1] !== 'PlacedBlocks') {
    return { userId: undefined, encodedMidpoint: undefined }
  }
  const userId = tonumber(path[0])
  return { userId, encodedMidpoint: path[2] }
}
