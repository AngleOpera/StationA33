import { OnStart, Service } from '@flamework/core'
import { Logger } from '@rbxts/log'
import Object from '@rbxts/object-utils'
import { ReplicatedStorage, Workspace } from '@rbxts/services'
import {
  BLOCK_ATTRIBUTE,
  INVENTORY,
  INVENTORY_ID,
  InventoryItemDescription,
  InventoryItemName,
} from 'ReplicatedStorage/shared/constants/core'
import {
  getItemFromBlock,
  getItemVector3,
} from 'ReplicatedStorage/shared/utils/core'
import {
  decodeMeshData,
  decodeMeshMidpoint,
  encodeMeshMidpoint,
  getCFrameFromMeshMidpoint,
  gridSpacing,
  MeshMap,
  MeshPlot,
  meshPlotAdd,
  meshPlotRemove,
  validMeshMidpoint,
} from 'ReplicatedStorage/shared/utils/mesh'
import { Functions } from 'ServerScriptService/network'

export interface PlayerSandbox {
  location: PlotLocation
  workspace: PlayerSpace
  plot: Record<PlotLocation, MeshPlot>
}

@Service()
export class MeshService implements OnStart {
  playerSandbox: Record<string, PlayerSandbox> = {}

  constructor(protected readonly logger: Logger) {}

  onStart() {
    Functions.placeBlock.setCallback((player, itemName, midpoint, rotation) =>
      this.handlePlaceBlock(player, itemName, midpoint, rotation),
    )
    Functions.breakBlock.setCallback((player, midpoint) =>
      this.handleBreakBlock(player, midpoint),
    )
  }

  getPlayerSandbox(player: Player) {
    return this.getUserIdSandbox(player.UserId)
  }

  getUserIdSandbox(userId: number) {
    return this.playerSandbox[`${userId}`]
  }

  loadPlayerSandbox(
    player: Player,
    playerSpace: PlayerSpace,
    location: PlotLocation,
    mesh: Partial<Record<PlotLocation, MeshMap>>,
  ) {
    const key = `${player.UserId}`
    const playerSandbox: PlayerSandbox = {
      location,
      workspace: playerSpace,
      plot: Object.fromEntries(
        Object.entries(mesh).map(([key, value]) => [
          key,
          {
            mesh: value,
            inputs: {},
            outputs: {},
          },
        ]),
      ),
    }
    this.playerSandbox[key] = playerSandbox
    this.loadPlayerSandboxMesh(player, playerSandbox)
  }

  unloadPlayerSandbox(player: Player) {
    const key = `${player.UserId}`
    delete this.playerSandbox[key]
  }

  loadPlayerSandboxMesh(player: Player, playerSandbox: PlayerSandbox) {
    const plot = playerSandbox.plot[playerSandbox.location]
    const placedBlocksFolder = playerSandbox.workspace.PlacedBlocks
    for (const [encodedMidpoint, encodedData] of Object.entries(plot.mesh)) {
      const midpoint = decodeMeshMidpoint(encodedMidpoint)
      const data = decodeMeshData(encodedData)
      const item = INVENTORY_ID[data.blockId]
      if (!item) {
        this.logger.Warn(
          `MeshService.loadPlayerSandbox: Unknown item ${data.blockId}`,
        )
        continue
      }
      const model = this.cloneBlock(
        playerSandbox,
        item,
        midpoint,
        data.rotation,
      )
      if (model) {
        model.Name = encodedMidpoint
        model.Parent = placedBlocksFolder
      }
    }
  }

  reloadPlayerSandbox(player: Player) {
    const playerSandbox = this.getPlayerSandbox(player)
    if (!playerSandbox) return
    playerSandbox.workspace.PlacedBlocks.ClearAllChildren()
    this.loadPlayerSandboxMesh(player, playerSandbox)
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
        `MeshService.handlePlaceBlock: Player ${player.Name} has no sandbox`,
      )
      return
    }
    if (!validMeshMidpoint(midpoint)) {
      this.logger.Warn(
        `MeshService.handlePlaceBlock: Invalid midpoint ${midpoint}`,
      )
      return
    }
    const item = INVENTORY[itemName]
    if (!item) {
      this.logger.Error(`MeshService.placeBlock: Item ${itemName} unknown`)
      return undefined
    }

    const clonedModel = this.cloneBlock(playerSandbox, item, midpoint, rotation)
    if (!clonedModel) return

    const plot = playerSandbox.plot[playerSandbox.location]
    const encodedMidpoint = meshPlotAdd(plot, midpoint, item, rotation)

    const clonedSound = Workspace.Audio.BlockPlaced.Clone()
    clonedSound.Parent = clonedModel
    clonedModel.Name = encodedMidpoint
    clonedModel.Parent = playerSandbox.workspace.PlacedBlocks
    clonedSound.Play()
  }

  handleBreakBlock(player: Player, midpoint: Vector3) {
    const playerSandbox = this.getPlayerSandbox(player)
    if (!playerSandbox) {
      this.logger.Warn(
        `MeshService.handlePlaceBlock: Player ${player.Name} has no sandbox`,
      )
      return
    }
    if (!validMeshMidpoint(midpoint)) {
      this.logger.Warn(
        `MeshService.handlePlaceBlock: Invalid midpoint ${midpoint}`,
      )
      return
    }
    const encodedMidpoint = encodeMeshMidpoint(midpoint)
    const target =
      playerSandbox.workspace.PlacedBlocks.FindFirstChild<Model>(
        encodedMidpoint,
      )
    if (!target) {
      this.logger.Warn(
        `MeshService.handleBreakBlock: Block ${encodedMidpoint} not found`,
      )
      return
    }
    const item = getItemFromBlock(target)
    if (!item) {
      this.logger.Warn(
        `MeshService.handleBreakBlock: Block ${encodedMidpoint} item not found`,
      )
      return
    }

    const plot = playerSandbox.plot[playerSandbox.location]
    meshPlotRemove(plot, midpoint, item)

    const clonedSoundBlock = new Instance('Part')
    clonedSoundBlock.Size = new Vector3(gridSpacing, gridSpacing, gridSpacing)
    clonedSoundBlock.Transparency = 1
    clonedSoundBlock.PivotTo(target.GetPivot())
    const clonedSound = Workspace.Audio.BlockBroken.Clone()
    clonedSound.Ended.Connect(() => clonedSoundBlock.Destroy())
    clonedSound.Parent = clonedSoundBlock
    clonedSoundBlock.Parent = playerSandbox.workspace.PlaceBlockPreview
    clonedSound.Play()
    target.Destroy()
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
      this.logger.Error(`MeshService.cloneBlock: Item ${item.name} not found`)
      return undefined
    }

    const clonedModel = templateModel.Clone()
    const bounding = new Instance('Part')
    const size = getItemVector3(item.size)
    bounding.Name = 'Bounding'
    bounding.Position = clonedModel.GetPivot().Position
    bounding.Size = size.mul(gridSpacing)
    bounding.Anchored = true
    bounding.CanCollide = false
    bounding.Transparency = 1.0
    bounding.Parent = clonedModel
    clonedModel.PivotTo(
      getCFrameFromMeshMidpoint(
        midpoint,
        size,
        rotation,
        playerSandbox.workspace.Plot.Baseplate,
      ),
    )

    const touchingParts = bounding.GetTouchingParts()
    if (touchingParts.size() > 0) {
      this.logger.Warn(
        `MeshService.cloneBlock: Item ${item.name} intersects with existing mesh`,
      )
      clonedModel.Destroy()
      return undefined
    }

    clonedModel.SetAttribute(BLOCK_ATTRIBUTE.BlockId, item.blockId)
    return clonedModel
  }
}
