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
  MeshMap,
  validMeshMidpoint,
} from 'ReplicatedStorage/shared/utils/mesh'
import { Functions } from 'ServerScriptService/network'

export interface PlayerSandbox {
  location: PlotLocation
  mesh: Record<string, MeshMap>
  workspace: PlayerSpace
}

@Service()
export class PlaceBlockService implements OnStart {
  playerSandbox: Record<string, PlayerSandbox> = {}

  constructor(protected readonly logger: Logger) {}

  onStart() {
    Functions.placeBlock.setCallback((player, itemName, midpoint, rotation) =>
      this.handlePlaceBlock(player, itemName, midpoint, rotation),
    )
    Functions.breakBlock.setCallback((player, target) => {
      const playerSandbox = this.getPlayerSandbox(player)
      if (!playerSandbox || !typeIs(target, 'Instance') || !target.IsA('Part'))
        return
      const clonedSoundBlock = new Instance('Part')
      clonedSoundBlock.Size = new Vector3(3, 3, 3)
      clonedSoundBlock.CFrame = target.CFrame
      const clonedSound = Workspace.Audio.BlockBroken.Clone()
      clonedSound.Ended.Connect(() => clonedSoundBlock.Destroy())
      clonedSound.Parent = clonedSoundBlock
      clonedSoundBlock.Parent = playerSandbox.workspace.PlaceBlockPreview
      clonedSound.Play()
      target.Destroy()
    })
  }

  getPlayerSandbox(player: Player) {
    return this.playerSandbox[`${player.UserId}`]
  }

  loadPlayerSandbox(player: Player, playerSandbox?: PlayerSandbox) {
    const key = `${player.UserId}`
    if (!playerSandbox) {
      delete this.playerSandbox[key]
      return
    }
    this.playerSandbox[key] = playerSandbox
  }

  handlePlaceBlock(
    player: Player,
    itemName: InventoryItemName,
    midpoint: Vector3,
    rotation: Vector3,
  ) {
    const playerSandbox = this.getPlayerSandbox(player)
    if (!playerSandbox) {
      this.logger.Warn(
        `PlaceBlockService.handlePlaceBlock: Player ${player.Name} has no sandbox`,
      )
      return
    }
    if (!validMeshMidpoint(midpoint)) {
      this.logger.Warn(
        `PlaceBlockService.handlePlaceBlock: Invalid midpoint ${midpoint}`,
      )
      return
    }
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
        playerSandbox.workspace.Plot.Baseplate,
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
    clonedModel.Parent = playerSandbox.workspace.PlacedBlocks
    clonedSound.Play()
  }
}
