import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { Players, ReplicatedStorage, RunService } from '@rbxts/services'
import { BreakBlockToolTag } from 'ReplicatedStorage/shared/constants/tags'
import { PlaceBlockController } from 'StarterPlayer/StarterPlayerScripts/controllers/PlaceBlockController'
import { Functions } from 'StarterPlayer/StarterPlayerScripts/network'

@Component({ tag: BreakBlockToolTag })
export class BreakBlockToolComponent
  extends BaseComponent<BlockBreakerAttributes, BreakBlockTool>
  implements OnStart
{
  connection: RBXScriptConnection | undefined
  target: Model | undefined
  invoking = false

  constructor(protected placeBlockController: PlaceBlockController) {
    super()
  }

  onStart() {
    const { placedBlocksFolder, previewBlockFolder } =
      this.placeBlockController.getFolders()

    const previewBlock = ReplicatedStorage.Common.PlaceBlockPreview
    const previewBlockParent = previewBlock.Parent
    const selectionBox = previewBlock.SelectionBox

    const tool = this.instance
    const red = Color3.fromRGB(255, 0, 0)

    const mouse = Players.LocalPlayer.GetMouse()
    mouse.TargetFilter = previewBlockFolder

    tool.Equipped.Connect(() => {
      const character = Players.LocalPlayer.Character as PlayerCharacter
      const humanoid = character.Humanoid

      selectionBox.Color3 = red

      this.connection = RunService.RenderStepped.Connect((_deltaTime) => {
        if (!mouse.Target) return
        const targetParent = mouse.Target?.Parent
        if (
          humanoid.Health <= 0 ||
          !character.PrimaryPart ||
          !targetParent ||
          targetParent.Parent !== placedBlocksFolder ||
          !targetParent.IsA('Model') ||
          mouse.Hit.Position.sub(character.PrimaryPart.Position).Magnitude >
            this.attributes.MaxDistance
        ) {
          previewBlock.Parent = previewBlockParent
          this.target = undefined
          return
        }

        this.target = targetParent
        previewBlock.CFrame = targetParent.GetPivot()
        previewBlock.Parent = previewBlockFolder
      })
    })

    tool.Unequipped.Connect(() => {
      this.connection?.Disconnect()
      this.connection = undefined
      this.target = undefined
      previewBlock.Parent = previewBlockParent
    })

    tool.Activated.Connect(() => {
      if (!this.target || this.invoking) return
      this.invoking = true
      Functions.breakBlock.invoke(this.target)
      previewBlock.Parent = previewBlockParent
      this.target = undefined
      this.invoking = false
    })
  }
}
