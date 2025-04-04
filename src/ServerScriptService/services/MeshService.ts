import { OnStart, Service } from '@flamework/core'
import { Logger } from '@rbxts/log'
import Object from '@rbxts/object-utils'
import { Workspace } from '@rbxts/services'
import {
  INVENTORY,
  INVENTORY_ID,
  InventoryItemName,
  PLACE_PLOT_LOCATION,
} from 'ReplicatedStorage/shared/constants/core'
import { selectPlayerInventoryItem } from 'ReplicatedStorage/shared/state'
import { cloneBlock } from 'ReplicatedStorage/shared/utils/block'
import { getItemFromBlock } from 'ReplicatedStorage/shared/utils/core'
import {
  decodeMeshData,
  decodeMeshMidpoint,
  encodeMeshMidpoint,
  getMeshRotationFromCFrame,
  gridSpacing,
  MeshMap,
  MeshPlot,
  meshPlotAdd,
  meshPlotRemove,
  validMeshMidpoint,
} from 'ReplicatedStorage/shared/utils/mesh'
import { Functions } from 'ServerScriptService/network'
import { store } from 'ServerScriptService/store'

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
    this.loadPlayerSandbox(
      0,
      Workspace.PlayerSpaces['0'],
      PLACE_PLOT_LOCATION,
      { [PLACE_PLOT_LOCATION]: {} },
    )
    Functions.placeBlock.setCallback(
      (player, itemName, plotId, midpoint, rotation) => {
        try {
          this.handlePlaceBlock(player, itemName, plotId, midpoint, rotation)
        } catch (e) {
          this.logger.Error(`MeshService.placeBlock: ${e}`)
        }
      },
    )
    Functions.breakBlock.setCallback((player, plotId, midpoint) => {
      try {
        this.handleBreakBlock(player, plotId, midpoint)
      } catch (e) {
        this.logger.Error(`MeshService.breakBlock: ${e}`)
      }
    })
    Functions.moveItem.setCallback((player, container, item, amount) => {
      try {
        store.movePlayerItem(player.UserId, container, item, amount)
      } catch (e) {
        this.logger.Error(`MeshService.moveItem: ${e}`)
      }
    })
  }

  getPlayerSandbox(player: Player, plotId?: string) {
    const key = `${player.UserId}`
    if (plotId && plotId !== '0' && plotId !== key) return undefined
    return this.playerSandbox[plotId || key]
  }

  getUserSandbox(userId: number) {
    return this.playerSandbox[`${userId}`]
  }

  loadPlayerSandbox(
    userId: number,
    playerSpace: PlayerSpace,
    location: PlotLocation,
    mesh: Partial<Record<PlotLocation, MeshMap>>,
  ) {
    const key = `${userId}`
    const playerSandbox: PlayerSandbox = {
      location,
      workspace: playerSpace,
      plot: Object.fromEntries(
        Object.entries(mesh).map(([key, value]) => [
          key,
          {
            userId,
            mesh: value,
            inputFrom: {},
            inputTo: {},
            outputTo: {},
            entity: {},
          },
        ]),
      ),
    }
    this.playerSandbox[key] = playerSandbox
    this.loadPlayerSandboxMesh(playerSandbox)
  }

  unloadPlayerSandbox(userId: number) {
    const key = `${userId}`
    delete this.playerSandbox[key]
  }

  loadPlayerSandboxMesh(playerSandbox: PlayerSandbox) {
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
      const model = cloneBlock(
        item,
        midpoint,
        data.rotation,
        playerSandbox.workspace.Plot.Baseplate,
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
    this.loadPlayerSandboxMesh(playerSandbox)
  }

  handlePlaceBlock(
    player: Player,
    itemName: InventoryItemName,
    plotId: string,
    midpoint: Vector3,
    rotation: Vector3,
  ) {
    const playerSandbox = this.getPlayerSandbox(player, plotId)
    if (!playerSandbox) {
      this.logger.Warn(
        `MeshService.handlePlaceBlock: Player ${player.Name} has no sandbox`,
      )
      return
    }
    if (!validMeshMidpoint(midpoint)) {
      this.logger.Warn(
        `MeshService.handlePlaceBlock: Player ${player.Name} sent invalid midpoint ${midpoint}`,
      )
      return
    }
    const item = INVENTORY[itemName]
    if (!item) {
      this.logger.Error(
        `MeshService.placeBlock: Player ${player.Name} sent unknown item ${itemName}`,
      )
      return
    }

    const inventoryItemSelector = selectPlayerInventoryItem(
      player.UserId,
      itemName,
    )
    const state = store.getState()
    const newState = store.updatePlayerInventory(player.UserId, itemName, -1)
    const oldNumItems = inventoryItemSelector(state)
    const newNumItems = inventoryItemSelector(newState)
    if (oldNumItems === newNumItems) {
      this.logger.Error(
        `MeshService.placeBlock: Player ${player.Name} has ${oldNumItems} ${itemName} `,
      )
      return
    }

    const clonedModel = cloneBlock(
      item,
      midpoint,
      rotation,
      playerSandbox.workspace.Plot.Baseplate,
    )
    if (!clonedModel) {
      store.updatePlayerInventory(player.UserId, itemName, 1)
      return
    }

    const plot = playerSandbox.plot[playerSandbox.location]
    const encodedMidpoint = meshPlotAdd(plot, midpoint, rotation, item)
    const clonedSound = Workspace.Audio.BlockPlaced.Clone()
    clonedSound.Parent = clonedModel
    clonedModel.Name = encodedMidpoint
    clonedModel.Parent = playerSandbox.workspace.PlacedBlocks
    clonedSound.Play()
  }

  handleBreakBlock(player: Player, plotId: string, midpoint: Vector3) {
    const playerSandbox = this.getPlayerSandbox(player, plotId)
    if (!playerSandbox) {
      this.logger.Warn(
        `MeshService.handleBreakBlock: Player ${player.Name} has no sandbox`,
      )
      return
    }
    if (!validMeshMidpoint(midpoint)) {
      this.logger.Warn(
        `MeshService.handleBreakBlock: Player ${player.Name} sent invalid midpoint ${midpoint}`,
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
        `MeshService.handleBreakBlock: Player ${player.Name} sent unknown midpoint ${encodedMidpoint}`,
      )
      return
    }
    const item = getItemFromBlock(target)
    if (!item) {
      this.logger.Warn(
        `MeshService.handleBreakBlock: Player ${player.Name} broke ${encodedMidpoint} missing item`,
      )
      return
    }

    const plot = playerSandbox.plot[playerSandbox.location]
    const rotation = getMeshRotationFromCFrame(
      target.GetPivot(),
      playerSandbox.workspace.Plot.Baseplate,
    )
    meshPlotRemove(plot, midpoint, rotation, item)
    if (item.name === INVENTORY.Container.name) {
      store.breakPlayerContainer(player.UserId, encodedMidpoint)
    }

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
}
