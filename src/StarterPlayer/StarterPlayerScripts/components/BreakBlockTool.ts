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

    let connection: RBXScriptConnection | undefined
    let targetToDestory: BasePart | undefined
    let canUse = true

    const mouse = Players.LocalPlayer.GetMouse()
    mouse.TargetFilter = previewBlockFolder

    tool.Equipped.Connect(() => {
      const character = Players.LocalPlayer.Character as PlayerCharacter
      const humanoid = character.Humanoid

      selectionBox.Color3 = red
      connection = RunService.RenderStepped.Connect((_deltaTime) => {
        const mouseHit = mouse.Hit
        if (
          character.PrimaryPart &&
          mouseHit.Position.sub(character.PrimaryPart.Position).Magnitude <=
            this.attributes.MaxDistance &&
          humanoid.Health > 0 &&
          mouse.Target &&
          mouse.Target.Parent === placedBlocksFolder
        ) {
          previewBlock.CFrame = mouse.Target.CFrame
          previewBlock.Parent = previewBlockFolder
          targetToDestory = mouse.Target
        } else {
          previewBlock.Parent = previewBlockParent
          targetToDestory = undefined
        }
      })
    })

    tool.Unequipped.Connect(() => {
      connection?.Disconnect()
      previewBlock.Parent = previewBlockParent
    })

    tool.Activated.Connect(() => {
      if (!canUse || !targetToDestory) return
      canUse = false
      Functions.breakBlock.invoke(targetToDestory)
      previewBlock.Parent = previewBlockParent
      targetToDestory = undefined
      canUse = true
    })
  }
}
