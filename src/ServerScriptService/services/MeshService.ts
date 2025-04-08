import { OnStart, Service } from '@flamework/core'
import { Logger } from '@rbxts/log'
import Object from '@rbxts/object-utils'
import { Workspace } from '@rbxts/services'
import {
  BLOCK_ID_LOOKUP,
  INVENTORY,
  INVENTORY_ID,
  InventoryItemName,
  PLACE_PLOT_LOCATION,
} from 'ReplicatedStorage/shared/constants/core'
import { selectPlayerInventoryItem } from 'ReplicatedStorage/shared/state'
import { cloneBlock, overlapParams } from 'ReplicatedStorage/shared/utils/block'
import { rotation0 } from 'ReplicatedStorage/shared/utils/core'
import { grandParentIs } from 'ReplicatedStorage/shared/utils/instance'
import {
  decodeMeshData,
  decodeMeshMidpoint,
  encodeMeshData,
  encodeMeshMidpoint,
  gridSpacing,
  MeshMap,
  meshMapGetEncoded,
  MeshPlot,
  meshPlotAdd,
  meshPlotRemove,
  validMeshMidpoint,
} from 'ReplicatedStorage/shared/utils/mesh'
import { createBoundingPart } from 'ReplicatedStorage/shared/utils/part'
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
  debug = true

  constructor(protected readonly logger: Logger) {}

  onStart() {
    this.loadPlayerSandbox(
      0,
      Workspace.PlayerSpaces['0'],
      PLACE_PLOT_LOCATION,
      {
        [PLACE_PLOT_LOCATION]: {
          [encodeMeshMidpoint(new Vector3(397, 4, 341))]: encodeMeshData({
            blockId: INVENTORY.Bricks.blockId,
            rotation: rotation0,
            size: new Vector3(4, 4, 110),
          }),
        },
      },
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
        data.size,
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
      new Vector3(1, 1, 1),
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
    if (this.debug) {
      this.logger.Debug(
        `MeshService.placeBlock: Player ${player.UserId} placed ${itemName} at ${midpoint}`,
      )
    }
  }

  handleBreakBlock(player: Player, plotId: string, targetMidpoint: Vector3) {
    const playerSandbox = this.getPlayerSandbox(player, plotId)
    if (!playerSandbox) {
      this.logger.Warn(
        `MeshService.handleBreakBlock: Player ${player.UserId} has no sandbox`,
      )
      return
    }
    if (!validMeshMidpoint(targetMidpoint)) {
      this.logger.Warn(
        `MeshService.handleBreakBlock: Player ${player.UserId} sent invalid midpoint ${targetMidpoint}`,
      )
      return
    }

    const plot = playerSandbox.plot[playerSandbox.location]
    const encodedTargetMidpoint = encodeMeshMidpoint(targetMidpoint)
    let meshMidpoint = targetMidpoint
    let encodedMeshMidpoint = encodedTargetMidpoint
    let data = meshMapGetEncoded(plot.mesh, encodedMeshMidpoint)
    if (!data) {
      const bounding = createBoundingPart(
        targetMidpoint,
        new Vector3(1, 1, 1).mul(gridSpacing * 0.99),
      )
      const touchingParts = Workspace.GetPartsInPart(bounding, overlapParams)
      if (
        touchingParts.size() === 1 &&
        grandParentIs(touchingParts[0], playerSandbox.workspace.PlacedBlocks)
      ) {
        encodedMeshMidpoint = touchingParts[0].Name
        meshMidpoint = decodeMeshMidpoint(encodedMeshMidpoint)
        data = meshMapGetEncoded(plot.mesh, encodedMeshMidpoint)
      }
      bounding.Destroy()
    }
    if (!data) {
      this.logger.Warn(
        `MeshService.handleBreakBlock: Player ${player.UserId} broke (${meshMidpoint}) missing mesh data`,
      )
      return
    }
    const item = BLOCK_ID_LOOKUP[data.blockId]
    if (!item) {
      this.logger.Warn(
        `MeshService.handleBreakBlock: Player ${player.UserId} broke (${meshMidpoint}) missing block`,
      )
      return
    }

    const target =
      playerSandbox.workspace.PlacedBlocks.FindFirstChild<Model>(
        encodedMeshMidpoint,
      )
    if (!target) {
      this.logger.Warn(
        `MeshService.handleBreakBlock: Player ${player.UserId} sent unknown midpoint (${meshMidpoint})`,
      )
      return
    }

    meshPlotRemove(plot, meshMidpoint, data.rotation, item)

    if (item.name === INVENTORY.Container.name) {
      store.breakPlayerContainer(player.UserId, encodedMeshMidpoint)
    } else {
      store.updatePlayerInventory(player.UserId, item.name, 1)
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
