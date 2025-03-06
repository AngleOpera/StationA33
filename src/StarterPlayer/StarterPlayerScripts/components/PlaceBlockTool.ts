import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { Players, ReplicatedStorage, RunService } from '@rbxts/services'
import { PlaceBlockToolTag } from 'ReplicatedStorage/shared/constants/tags'
import { PlayerController } from 'StarterPlayer/StarterPlayerScripts/controllers/PlayerController'

@Component({ tag: PlaceBlockToolTag })
export class PlaceBlockToolComponent
  extends BaseComponent<PlaceBlockToolAttributes, PlaceBlockTool>
  implements OnStart
{
  constructor(protected playerController: PlayerController) {
    super()
  }

  onStart() {
    const playerSpace = this.playerController.getPlayerSpace()
    const baseplate = playerSpace.Plot.Baseplate
    const buildingModel = playerSpace.PlacedBlocks
    const ignoreModelForMouse = playerSpace.PlaceBlockPreview

    const bottom = Enum.NormalId.Bottom
    const top = Enum.NormalId.Top
    const front = Enum.NormalId.Front
    const left = Enum.NormalId.Left
    const right = Enum.NormalId.Right

    const leftOffset = new CFrame(-3, 0, 0)
    const rightOffset = new CFrame(3, 0, 0)
    const frontOffset = new CFrame(0, 0, -3)
    const backOffset = new CFrame(0, 0, 3)
    const bottomOffset = new CFrame(0, -3, 0)
    const topOffet = new CFrame(0, 3, 0)

    const y = (baseplate.Size.Y + 3) / 2 + baseplate.Position.Y
    const character = Players.LocalPlayer.Character as PlayerCharacter
    const humanoid = character.Humanoid

    const mouse = Players.LocalPlayer.GetMouse()
    mouse.TargetFilter = ignoreModelForMouse

    let canUse = true
    let connection: RBXScriptConnection | undefined
    let preview: BasePart | Model | undefined

    this.instance.Equipped.Connect(() => {
      connection = RunService.RenderStepped.Connect((_deltaTime) => {
        const mouseHit = mouse.Hit
        if (
          character.PrimaryPart &&
          mouseHit.Position.sub(character.PrimaryPart.Position).Magnitude <=
            this.attributes.MaxDistance &&
          humanoid.Health > 0
        ) {
          const mouseTarget = mouse.Target
          if (mouseTarget === baseplate) {
            const previewBlock =
              preview ||
              ReplicatedStorage.Items?.FindFirstChild<Model>(
                this.attributes.ItemName,
              )?.Clone() ||
              ReplicatedStorage.Common.PlaceBlockPreview.Clone()
            preview = previewBlock

            const x = math.floor(mouseHit.X) + 0.5
            const z = math.floor(mouseHit.Z) + 0.5
            previewBlock.PivotTo(
              new CFrame(x + calculateOffset(x), y, z + calculateOffset(z)),
            )
            previewBlock.Parent = ignoreModelForMouse
          } else if (mouseTarget?.Parent === buildingModel) {
            const previewBlock =
              preview || ReplicatedStorage.Common.PlaceBlockPreview.Clone()
            preview = previewBlock

            const mouseSurface = mouse.TargetSurface
            if (mouseSurface === left)
              previewBlock.PivotTo(mouseTarget.CFrame.ToWorldSpace(leftOffset))
            else if (mouseSurface === right)
              previewBlock.PivotTo(mouseTarget.CFrame.ToWorldSpace(rightOffset))
            else if (mouseSurface === bottom)
              previewBlock.PivotTo(
                mouseTarget.CFrame.ToWorldSpace(bottomOffset),
              )
            else if (mouseSurface === top)
              previewBlock.PivotTo(mouseTarget.CFrame.ToWorldSpace(topOffet))
            else if (mouseSurface === front)
              previewBlock.PivotTo(mouseTarget.CFrame.ToWorldSpace(frontOffset))
            // Back
            else
              previewBlock.PivotTo(mouseTarget.CFrame.ToWorldSpace(backOffset))

            previewBlock.Parent = ignoreModelForMouse
          } else {
            preview?.Destroy()
            preview = undefined
          }
        } else {
          preview?.Destroy()
          preview = undefined
        }
      })
    })

    this.instance.Unequipped.Connect(() => {
      connection?.Disconnect()
      connection = undefined
      preview?.Destroy()
      preview = undefined
    })

    this.instance.Activated.Connect(() => {
      if (canUse && preview?.Parent === ignoreModelForMouse) {
        canUse = false
        this.instance.PlaceBlock.InvokeServer(preview.GetPivot())
        canUse = true
      }
    })
  }
}

function calculateOffset(positionNumber: number) {
  if ((positionNumber * 10) % 3 === 1) return -1
  else if ((positionNumber * 10) % 3 === 2) return 1
  else return 0
}
