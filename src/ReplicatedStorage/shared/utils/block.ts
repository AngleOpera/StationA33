import { ReplicatedStorage, Workspace } from '@rbxts/services'
import {
  BLOCK_ATTRIBUTE,
  InventoryItemDescription,
} from 'ReplicatedStorage/shared/constants/core'
import {
  getItemVector3,
  getLogger,
  gridSpacing,
  Rotation,
} from 'ReplicatedStorage/shared/utils/core'
import {
  findDescendentsWhichAre,
  findPathToDescendent,
} from 'ReplicatedStorage/shared/utils/instance'
import {
  getCFrameFromMeshMidpoint,
  isMeshed,
  MeshMidpoint,
} from 'ReplicatedStorage/shared/utils/mesh'
import { createBoundingPart } from 'ReplicatedStorage/shared/utils/part'

export const overlapParams = (() => {
  const x = new OverlapParams()
  x.CollisionGroup = 'Bounding'
  return x
})()

export function cloneBlock(
  item: InventoryItemDescription,
  midpoint: MeshMidpoint,
  meshSize: Vector3,
  rotation: Rotation,
  baseplate: BasePart,
  options?: {
    ignoreExisting?: boolean
    offset?: Vector3
  },
) {
  const templateModel = ReplicatedStorage.Items.FindFirstChild<Model>(item.name)
  if (!templateModel) {
    getLogger().Error(`cloneBlock: Item ${item.name} not found`)
    return undefined
  }

  const clonedModel = templateModel.Clone()

  let size
  if (isMeshed(item.size, meshSize)) {
    findDescendentsWhichAre<BasePart>(clonedModel, 'BasePart').forEach(
      (part) => (part.Size = part.Size.mul(meshSize)),
    )
    size = meshSize
  } else {
    size = getItemVector3(item.size)
  }

  const bounding = createBoundingPart(
    clonedModel.GetPivot().Position,
    size.mul(gridSpacing * 0.99),
    clonedModel,
  )
  clonedModel.PivotTo(
    getCFrameFromMeshMidpoint(
      midpoint,
      size,
      rotation,
      baseplate,
      options?.offset,
    ),
  )

  if (!options?.ignoreExisting) {
    const touchingParts = Workspace.GetPartsInPart(bounding, overlapParams)
    if (touchingParts.size() > 0) {
      getLogger().Warn(
        `cloneBlock: Item ${item.name} intersects with existing mesh`,
      )
      clonedModel.Destroy()
      return undefined
    }
  }

  clonedModel.SetAttribute(BLOCK_ATTRIBUTE.BlockId, item.blockId)
  return clonedModel
}

export function findPlacedBlockFromDescendent(descendent: Instance) {
  const path = findPathToDescendent(Workspace.PlayerSpaces, descendent)
  if (!path || path.size() < 3 || path[1] !== 'PlacedBlocks') {
    return { userId: undefined, encodedMidpoint: undefined }
  }
  const userId = tonumber(path[0])
  return { userId, encodedMidpoint: path[2] }
}
