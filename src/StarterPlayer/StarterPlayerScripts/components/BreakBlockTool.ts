import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { Logger } from '@rbxts/log'
import { Players, ReplicatedStorage, RunService } from '@rbxts/services'
import { TYPE } from 'ReplicatedStorage/shared/constants/core'
import { BreakBlockToolTag } from 'ReplicatedStorage/shared/constants/tags'
import {
  getExactOffsetForSurface,
  getItemVector3,
  getRotatedPoint,
  getRotatedSize,
  getRotatedSurface,
  gridSpacing,
} from 'ReplicatedStorage/shared/utils/core'
import {
  decodeMeshMidpoint,
  getCFrameFromMeshMidpoint,
  getMeshDataFromModel,
  getVoxelMidpointFromExactMidpointOffset,
  isMeshed,
  MeshMidpoint,
} from 'ReplicatedStorage/shared/utils/mesh'
import { getCharacter } from 'ReplicatedStorage/shared/utils/player'
import {
  PlaceBlockController,
  PlaceBlockPlot,
} from 'StarterPlayer/StarterPlayerScripts/controllers/PlaceBlockController'
import { Functions } from 'StarterPlayer/StarterPlayerScripts/network'

@Component({ tag: BreakBlockToolTag })
export class BreakBlockToolComponent
  extends BaseComponent<BlockBreakerAttributes, BreakBlockTool>
  implements OnStart
{
  connection: RBXScriptConnection | undefined
  plot: PlaceBlockPlot | undefined
  midpoint: MeshMidpoint | undefined
  preview: BlockPreview | undefined
  invoking = false

  constructor(
    protected placeBlockController: PlaceBlockController,
    protected logger: Logger,
  ) {
    super()
  }

  clear() {
    this.plot = undefined
    this.midpoint = undefined
    this.preview?.Destroy()
    this.preview = undefined
  }

  onStart() {
    const { placeBlockPlots, previewBlockFolder } =
      this.placeBlockController.getFolders()

    this.instance.Equipped.Connect(() => {
      const character = getCharacter(Players.LocalPlayer)
      const humanoid = character?.Humanoid

      const mouse = Players.LocalPlayer.GetMouse()
      mouse.TargetFilter = previewBlockFolder

      this.connection = RunService.RenderStepped.Connect((_deltaTime) => {
        if (!mouse.Target) return
        const targetModel = mouse.Target?.Parent
        if (
          !humanoid ||
          humanoid.Health <= 0 ||
          !character?.PrimaryPart ||
          !targetModel ||
          !targetModel.IsA(TYPE.Model) ||
          mouse.Hit.Position.sub(character.PrimaryPart.Position).Magnitude >
            this.attributes.MaxDistance
        ) {
          this.clear()
          return
        }

        this.plot = undefined

        for (const plot of placeBlockPlots) {
          const { placedBlocksFolder } = plot
          if (targetModel.Parent !== placedBlocksFolder) continue

          const { item, size, rotation } = getMeshDataFromModel(
            targetModel,
            plot.baseplate,
          )
          if (!item) continue

          let midpoint: MeshMidpoint
          try {
            midpoint = decodeMeshMidpoint(targetModel.Name)
          } catch {
            this.logger.Error(
              `BreakBlockToolComponent: Invalid midpoint ${targetModel.Name}`,
            )
            continue
          }

          this.plot = plot

          if (!this.preview) {
            this.preview = ReplicatedStorage.Common.BreakBlockPreview.Clone()
          }

          const unrotatedSize = getItemVector3(item.size)
          this.preview.Size = unrotatedSize.mul(gridSpacing)

          if (isMeshed(item.size, size)) {
            const targetRotatedHit = getRotatedPoint(
              targetModel
                .GetPivot()
                .ToObjectSpace(new CFrame(mouse.Hit.Position)).Position,
              rotation,
            )
            const targetRotatedSize = getRotatedSize(size, rotation)

            this.midpoint = getVoxelMidpointFromExactMidpointOffset(
              midpoint,
              targetRotatedSize,
              rotation,
              getExactOffsetForSurface(
                getRotatedSurface(mouse.TargetSurface, rotation.mul(-1)),
                targetRotatedHit,
                targetRotatedSize,
                new Vector3(-0.5, -0.5, -0.5),
              ),
            )
          } else {
            this.midpoint = midpoint
          }

          this.preview.PivotTo(
            getCFrameFromMeshMidpoint(
              this.midpoint,
              unrotatedSize,
              rotation,
              plot.baseplate,
            ),
          )

          if (!this.preview.Parent) this.preview.Parent = previewBlockFolder
          break
        }

        if (!this.plot) this.clear()
      })
    })

    this.instance.Unequipped.Connect(() => {
      this.connection?.Disconnect()
      this.connection = undefined
      this.clear()
    })

    this.instance.Activated.Connect(async () => {
      if (this.plot && this.midpoint && !this.invoking) {
        this.invoking = true
        await Functions.breakBlock.invoke(this.plot.plotId, this.midpoint)
        this.clear()
        this.invoking = false
      }
    })
  }
}
