import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { Logger } from '@rbxts/log'
import { Players, ReplicatedStorage, RunService } from '@rbxts/services'
import {
  BLOCK_ATTRIBUTE,
  INVENTORY_ID,
  TYPE,
} from 'ReplicatedStorage/shared/constants/core'
import { BreakBlockToolTag } from 'ReplicatedStorage/shared/constants/tags'
import { getItemVector3 } from 'ReplicatedStorage/shared/utils/core'
import {
  decodeMeshMidpoint,
  gridSpacing,
} from 'ReplicatedStorage/shared/utils/mesh'
import { getCharacter } from 'ReplicatedStorage/shared/utils/player'
import { PlaceBlockController } from 'StarterPlayer/StarterPlayerScripts/controllers/PlaceBlockController'
import { Functions } from 'StarterPlayer/StarterPlayerScripts/network'

@Component({ tag: BreakBlockToolTag })
export class BreakBlockToolComponent
  extends BaseComponent<BlockBreakerAttributes, BreakBlockTool>
  implements OnStart
{
  connection: RBXScriptConnection | undefined
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
    this.target = undefined
    this.preview?.Destroy()
    this.preview = undefined
  }

  onStart() {
    const { placedBlocksFolder, previewBlockFolder } =
      this.placeBlockController.getFolders()

    this.instance.Equipped.Connect(() => {
      const character = getCharacter(Players.LocalPlayer)
      const humanoid = character?.Humanoid

      const mouse = Players.LocalPlayer.GetMouse()
      mouse.TargetFilter = previewBlockFolder

      this.connection = RunService.RenderStepped.Connect((_deltaTime) => {
        if (!mouse.Target) return
        const targetParent = mouse.Target?.Parent
        if (
          !humanoid ||
          humanoid.Health <= 0 ||
          !character?.PrimaryPart ||
          !targetParent ||
          !targetParent.IsA(TYPE.Model) ||
          targetParent.Parent !== placedBlocksFolder ||
          mouse.Hit.Position.sub(character.PrimaryPart.Position).Magnitude >
            this.attributes.MaxDistance
        ) {
          this.clear()
          return
        }

        this.target = targetParent
        const targetBlockId = this.target.GetAttribute(BLOCK_ATTRIBUTE.BlockId)
        const targetItem = typeIs(targetBlockId, 'number')
          ? INVENTORY_ID[targetBlockId]
          : undefined
        if (!this.preview) {
          this.preview = ReplicatedStorage.Common.BreakBlockPreview.Clone()
        }
        if (targetItem) {
          this.preview.Size = getItemVector3(targetItem.size).mul(gridSpacing)
        }
        this.preview.PivotTo(targetParent.GetPivot())
        if (!this.preview.Parent) this.preview.Parent = previewBlockFolder
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
      if (this.target && !this.invoking) {
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
        await Functions.breakBlock.invoke(midpoint)
        this.preview?.Destroy()
        this.preview = undefined
        this.target = undefined
        this.invoking = false
      }
    })
  }
}
