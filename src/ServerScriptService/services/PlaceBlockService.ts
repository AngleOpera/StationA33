import { OnStart, Service } from '@flamework/core'
import { Logger } from '@rbxts/log'
import Object from '@rbxts/object-utils'
import { ReplicatedStorage, Workspace } from '@rbxts/services'
import {
  INVENTORY,
  INVENTORY_ID,
  InventoryItemDescription,
  InventoryItemName,
} from 'ReplicatedStorage/shared/constants/core'
import {
  decodeMeshData,
  decodeMeshMidpoint,
  encodeMeshMidpoint,
  getCFrameFromMeshMidpoint,
  gridSpacing,
  MeshMap,
  meshMapAddEncoded,
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
    for (const [encodedMidpoint, encodedData] of Object.entries(
      playerSandbox.mesh[playerSandbox.location],
    )) {
      const midpoint = decodeMeshMidpoint(encodedMidpoint)
      const data = decodeMeshData(encodedData)
      const item = INVENTORY_ID[data.blockId]
      if (!item) {
        this.logger.Warn(
          `PlaceBlockService.loadPlayerSandbox: Unknown item ${data.blockId}`,
        )
        continue
      }
      this.cloneBlock(playerSandbox, item, midpoint, data.rotation)
    }
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
      return undefined
    }

    const clonedModel = this.cloneBlock(playerSandbox, item, midpoint, rotation)
    if (!clonedModel) return

    const encodedMidpoint = encodeMeshMidpoint(midpoint)
    meshMapAddEncoded(
      playerSandbox.mesh[playerSandbox.location],
      encodedMidpoint,
      { ...item, rotation },
    )

    const clonedSound = Workspace.Audio.BlockPlaced.Clone()
    clonedSound.Parent = clonedModel
    clonedModel.Name = encodedMidpoint
    clonedModel.Parent = playerSandbox.workspace.PlacedBlocks
    clonedSound.Play()
  }

  cloneBlock(
    playerSandbox: PlayerSandbox,
    item: InventoryItemDescription,
    midpoint: Vector3,
    rotation: Vector3,
  ) {
    const templateModel = ReplicatedStorage.Items.FindFirstChild<Model>(
      item.name,
    )
    if (!templateModel) {
      this.logger.Error(
        `PlaceBlockService.cloneBlock: Item ${item.name} not found`,
      )
      return undefined
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
        `PlaceBlockService.cloneBlock: Item ${item.name} intersects with existing mesh`,
      )
      clonedModel.Destroy()
      return undefined
    }

    return clonedModel
  }
}
