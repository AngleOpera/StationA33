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
import { gridSpacing, rotation0 } from 'ReplicatedStorage/shared/utils/core'
import { grandParentIs } from 'ReplicatedStorage/shared/utils/instance'
import { isWithinVector3 } from 'ReplicatedStorage/shared/utils/math'
import {
  decodeMeshData,
  decodeMeshMidpoint,
  encodeMeshData,
  encodeMeshMidpoint,
  getCFrameFromMeshMidpoint,
  getMeshMidpointSizeFromStartpointEndpoint,
  getMeshStartpointEndpointFromMidpointSize,
  isMeshed,
  MeshMap,
  meshMapGetEncoded,
  MeshPlot,
  meshPlotAdd,
  meshPlotLoad,
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
          [encodeMeshMidpoint(new Vector3(297, 4, 342))]: encodeMeshData({
            blockId: INVENTORY.Stone.blockId,
            rotation: rotation0,
            size: new Vector3(1, 9, 112),
          }),
          [encodeMeshMidpoint(new Vector3(321, 4, 281))]: encodeMeshData({
            blockId: INVENTORY.Stone.blockId,
            rotation: rotation0,
            size: new Vector3(37, 9, 1),
          }),
          [encodeMeshMidpoint(new Vector3(321, 4, 404))]: encodeMeshData({
            blockId: INVENTORY.Stone.blockId,
            rotation: rotation0,
            size: new Vector3(37, 9, 1),
          }),
          [encodeMeshMidpoint(new Vector3(341, 6, 281))]: encodeMeshData({
            blockId: INVENTORY.Stone.blockId,
            rotation: rotation0,
            size: new Vector3(4, 4, 1),
          }),
          [encodeMeshMidpoint(new Vector3(341, 6, 404))]: encodeMeshData({
            blockId: INVENTORY.Stone.blockId,
            rotation: rotation0,
            size: new Vector3(4, 4, 1),
          }),
          [encodeMeshMidpoint(new Vector3(362, 4, 281))]: encodeMeshData({
            blockId: INVENTORY.Stone.blockId,
            rotation: rotation0,
            size: new Vector3(37, 9, 1),
          }),
          [encodeMeshMidpoint(new Vector3(362, 4, 404))]: encodeMeshData({
            blockId: INVENTORY.Stone.blockId,
            rotation: rotation0,
            size: new Vector3(37, 9, 1),
          }),
          [encodeMeshMidpoint(new Vector3(386, 4, 342))]: encodeMeshData({
            blockId: INVENTORY.Stone.blockId,
            rotation: rotation0,
            size: new Vector3(1, 9, 112),
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
    Functions.breakBlock.setCallback((player, plotId, midpoint, damage) => {
      try {
        this.handleBreakBlock(player, plotId, midpoint, damage)
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
          meshPlotLoad({
            userId,
            mesh: value,
            inputFrom: {},
            inputTo: {},
            outputTo: {},
            entity: {},
          }),
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

  handleBreakBlock(
    player: Player,
    plotId: string,
    targetVoxel: Vector3,
    _damage?: number,
  ) {
    const playerSandbox = this.getPlayerSandbox(player, plotId)
    if (!playerSandbox) {
      this.logger.Warn(
        `MeshService.handleBreakBlock: Player ${player.UserId} has no sandbox`,
      )
      return
    }
    if (!validMeshMidpoint(targetVoxel)) {
      this.logger.Warn(
        `MeshService.handleBreakBlock: Player ${player.UserId} sent invalid midpoint ${targetVoxel}`,
      )
      return
    }

    const plot = playerSandbox.plot[playerSandbox.location]
    const baseplate = playerSandbox.workspace.Plot.Baseplate
    const encodedTargetMidpoint = encodeMeshMidpoint(targetVoxel)
    let meshMidpoint = targetVoxel
    let encodedMeshMidpoint = encodedTargetMidpoint
    let data = meshMapGetEncoded(plot.mesh, encodedMeshMidpoint)
    if (!data) {
      const bounding = createBoundingPart(
        getCFrameFromMeshMidpoint(
          targetVoxel,
          new Vector3(1, 1, 1),
          new Vector3(0, 0, 0),
          baseplate,
        ).Position,
        new Vector3(1, 1, 1).mul(gridSpacing * 0.99),
      )
      const touchingParts = Workspace.GetPartsInPart(
        bounding,
        overlapParams,
      ).filter((x) => grandParentIs(x, playerSandbox.workspace.PlacedBlocks))
      if (touchingParts.size() === 1) {
        encodedMeshMidpoint = touchingParts[0].Parent?.Name ?? ''
        data = meshMapGetEncoded(plot.mesh, encodedMeshMidpoint)
        meshMidpoint = decodeMeshMidpoint(encodedMeshMidpoint)
      } else {
        this.logger.Warn(
          `MeshService.handleBreakBlock: Player ${player.UserId} broke (${meshMidpoint}) touching ${touchingParts.size()}`,
        )
        return
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

    if (
      isMeshed(item.size, data.size) &&
      encodedMeshMidpoint !== encodedTargetMidpoint
    ) {
      const { startpoint, endpoint } =
        getMeshStartpointEndpointFromMidpointSize(
          meshMidpoint,
          data.size,
          data.rotation,
        )
      if (isWithinVector3(targetVoxel, startpoint, endpoint)) {
        if (this.debug)
          this.logger.Debug(
            `Player ${player.UserId} shattered [(${startpoint}), (${endpoint})] at (${targetVoxel})`,
          )

        const addFragment = (sp: Vector3, ep: Vector3) => {
          const { midpoint, size } = getMeshMidpointSizeFromStartpointEndpoint(
            sp,
            ep,
            data.rotation,
          )
          const model = cloneBlock(
            item,
            midpoint,
            size,
            data.rotation,
            baseplate,
            { ignoreExisting: true },
          )
          if (model) {
            model.Name = encodeMeshMidpoint(midpoint)
            model.Parent = playerSandbox.workspace.PlacedBlocks
            meshPlotAdd(plot, midpoint, data.rotation, item, size)
          }
        }

        if (targetVoxel.Z > startpoint.Z) {
          addFragment(
            startpoint,
            new Vector3(endpoint.X, endpoint.Y, targetVoxel.Z - 1),
          )
        }
        if (targetVoxel.Z < endpoint.Z) {
          addFragment(
            new Vector3(startpoint.X, startpoint.Y, targetVoxel.Z + 1),
            new Vector3(endpoint.X, endpoint.Y, endpoint.Z),
          )
        }
        if (targetVoxel.X > startpoint.X) {
          addFragment(
            new Vector3(startpoint.X, startpoint.Y, targetVoxel.Z),
            new Vector3(targetVoxel.X - 1, endpoint.Y, targetVoxel.Z),
          )
        }
        if (targetVoxel.X < endpoint.X) {
          addFragment(
            new Vector3(targetVoxel.X + 1, startpoint.Y, targetVoxel.Z),
            new Vector3(endpoint.X, endpoint.Y, targetVoxel.Z),
          )
        }
        if (targetVoxel.Y > startpoint.Y) {
          addFragment(
            new Vector3(targetVoxel.X, startpoint.Y, targetVoxel.Z),
            new Vector3(targetVoxel.X, targetVoxel.Y - 1, targetVoxel.Z),
          )
        }
        if (targetVoxel.Y < endpoint.Y) {
          addFragment(
            new Vector3(targetVoxel.X, targetVoxel.Y + 1, targetVoxel.Z),
            new Vector3(targetVoxel.X, endpoint.Y, targetVoxel.Z),
          )
        }
      }
    }

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
