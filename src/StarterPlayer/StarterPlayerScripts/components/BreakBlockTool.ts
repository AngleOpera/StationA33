import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { Logger } from '@rbxts/log'
import { Players, ReplicatedStorage, RunService } from '@rbxts/services'
import { TYPE } from 'ReplicatedStorage/shared/constants/core'
import { BreakBlockToolTag } from 'ReplicatedStorage/shared/constants/tags'
import { getItemVector3 } from 'ReplicatedStorage/shared/utils/core'
import {
  decodeMeshMidpoint,
  getMeshDataFromModel,
  gridSpacing,
  isMeshed,
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
  target: Model | undefined
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
    this.target = undefined
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
        const target = mouse.Target?.Parent
        if (
          !humanoid ||
          humanoid.Health <= 0 ||
          !character?.PrimaryPart ||
          !target ||
          !target.IsA(TYPE.Model) ||
          mouse.Hit.Position.sub(character.PrimaryPart.Position).Magnitude >
            this.attributes.MaxDistance
        ) {
          this.clear()
          return
        }

        this.plot = undefined
        this.target = undefined

        for (const plot of placeBlockPlots) {
          const { placedBlocksFolder } = plot
          if (target.Parent !== placedBlocksFolder) continue

          this.plot = plot
          this.target = target

          const { item, size } = getMeshDataFromModel(this.target)

          let cframe: CFrame
          if (item && isMeshed(item.size, size)) {
            cframe = target.GetPivot()
          } else {
            cframe = target.GetPivot()
          }

          if (!this.preview) {
            this.preview = ReplicatedStorage.Common.BreakBlockPreview.Clone()
          }
          if (item) {
            this.preview.Size = getItemVector3(item.size).mul(gridSpacing)
          }
          this.preview.PivotTo(cframe)
          if (!this.preview.Parent) this.preview.Parent = previewBlockFolder

          break
        }

        if (!this.plot) this.clear()
      })
    })

    this.instance.Unequipped.Connect(() => {
      this.connection?.Disconnect()
      this.connection = undefined
      this.target = undefined
      this.preview?.Destroy()
      this.preview = undefined
    })

    this.instance.Activated.Connect(async () => {
      if (this.plot && this.target && !this.invoking) {
        this.invoking = true
        let midpoint
        try {
          midpoint = decodeMeshMidpoint(this.target.Name)
        } catch {
          this.logger.Error(
            `BreakBlockToolComponent: Invalid midpoint ${this.target.Name}`,
          )
          this.invoking = false
          return
        }
        await Functions.breakBlock.invoke(this.plot.plotId, midpoint)
        this.preview?.Destroy()
        this.preview = undefined
        this.target = undefined
        this.invoking = false
      }
    })
  }
}
