import { OnStart, Service } from '@flamework/core'
import { Logger } from '@rbxts/log'
import { ReplicatedStorage, Workspace } from '@rbxts/services'
import {
  INVENTORY,
  InventoryItemName,
} from 'ReplicatedStorage/shared/constants/core'
import {
  encodeMeshData,
  encodeMeshMidPoint,
  getCFrameFromMeshMidpoint,
  gridSpacing,
} from 'ReplicatedStorage/shared/utils/mesh'
import { Functions } from 'ServerScriptService/network'
import { PlayerService } from 'ServerScriptService/services/PlayerService'

@Service()
export class PlaceBlockService implements OnStart {
  constructor(
    private playerService: PlayerService,
    protected readonly logger: Logger,
  ) {}

  onStart() {
    Functions.placeBlock.setCallback((player, itemName, midpoint, rotation) =>
      this.handlePlaceBlock(player, itemName, midpoint, rotation),
    )
    Functions.breakBlock.setCallback((player, target) => {
      const playerSpace = this.playerService.getPlayerSpace(player)
      if (!typeIs(target, 'Instance') || !target.IsA('Part')) return
      const clonedSoundBlock = new Instance('Part')
      clonedSoundBlock.Size = new Vector3(3, 3, 3)
      clonedSoundBlock.CFrame = target.CFrame
      const clonedSound = Workspace.Audio.BlockBroken.Clone()
      clonedSound.Ended.Connect(() => clonedSoundBlock.Destroy())
      clonedSound.Parent = clonedSoundBlock
      clonedSoundBlock.Parent = playerSpace.PlaceBlockPreview
      clonedSound.Play()
      target.Destroy()
    })
  }

  handlePlaceBlock(
    player: Player,
    itemName: InventoryItemName,
    midpoint: Vector3,
    rotation: Vector3,
  ) {
    const item = INVENTORY[itemName]
    if (!item) {
      this.logger.Error(
        `PlaceBlockService.placeBlock: Item ${itemName} unknown`,
      )
      return
    }
    const templateModel =
      ReplicatedStorage.Items.FindFirstChild<Model>(itemName)
    if (!templateModel) {
      this.logger.Error(
        `PlaceBlockService.placeBlock: Item ${itemName} not found`,
      )
      return
    }

    const playerSpace = this.playerService.getPlayerSpace(player)
    const clonedModel = templateModel.Clone()
    const bounding = new Instance('Part')
    bounding.Name = 'Bounding'
    bounding.Size = new Vector3(
      gridSpacing * item.width,
      gridSpacing * item.height,
      gridSpacing * item.length,
    )
    bounding.Anchored = true
    bounding.CanCollide = false
    bounding.Transparency = 1.0
    bounding.Parent = clonedModel
    clonedModel.PivotTo(
      getCFrameFromMeshMidpoint(
        midpoint,
        new Vector3(item.width, item.height, item.length),
        rotation,
        playerSpace.Plot.Baseplate,
      ),
    )

    const touchingParts = bounding.GetTouchingParts()
    if (touchingParts.size() > 0) {
      this.logger.Warn(
        `PlaceBlockService.placeBlock: Item ${itemName} intersects with existing mesh`,
      )
      clonedModel.Destroy()
      return
    }

    const encodedMidpoint = encodeMeshMidPoint(midpoint)
    const encodedMeshData = encodeMeshData({
      blockId: item.id,
      width: item.width,
      height: item.height,
      length: item.length,
      rotation,
    })
    print('state update', encodedMidpoint, encodedMeshData)

    const clonedSound = Workspace.Audio.BlockPlaced.Clone()
    clonedSound.Parent = clonedModel
    clonedModel.Name = encodedMidpoint
    clonedModel.Parent = playerSpace.PlacedBlocks
    clonedSound.Play()
  }
}
