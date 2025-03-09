import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { Players, ReplicatedStorage, RunService } from '@rbxts/services'
import { PlaceBlockToolTag } from 'ReplicatedStorage/shared/constants/tags'
import {
  getCFrameFromMeshMidpoint,
  getMeshMidpointFromWorldPosition,
  gridSpacing,
  MeshMidpoint,
  MeshRotation,
} from 'ReplicatedStorage/shared/utils/mesh'
import { PlaceBlockController } from 'StarterPlayer/StarterPlayerScripts/controllers/PlaceBlockController'
import { Functions } from 'StarterPlayer/StarterPlayerScripts/network'

@Component({ tag: PlaceBlockToolTag })
export class PlaceBlockToolComponent
  extends BaseComponent<PlaceBlockToolAttributes, PlaceBlockTool>
  implements OnStart
{
  connection: RBXScriptConnection | undefined
  midpoint: MeshMidpoint | undefined
  rotation: MeshRotation = new Vector3(0, 0, 0)
  preview: BasePart | Model | undefined
  invoking = false

  constructor(protected placeBlockController: PlaceBlockController) {
    super()
  }

  rotate() {
    this.rotation = new Vector3(0, (this.rotation.Y + 1) % 4, 0)
  }

  clear() {
    this.midpoint = undefined
    this.preview?.Destroy()
    this.preview = undefined
  }

  onStart() {
    const { baseplate, placedBlocksFolder, previewBlockFolder } =
      this.placeBlockController.getFolders()

    this.instance.Equipped.Connect(() => {
      this.placeBlockController.equipPlaceBlockTool(this)

      const character = Players.LocalPlayer.Character as PlayerCharacter
      const humanoid = character.Humanoid

      const mouse = Players.LocalPlayer.GetMouse()
      mouse.TargetFilter = previewBlockFolder

      this.connection = RunService.RenderStepped.Connect((_deltaTime) => {
        const item = this.placeBlockController.getItem()
        if (
          !item ||
          !character.PrimaryPart ||
          humanoid.Health <= 0 ||
          mouse.Hit.Position.sub(character.PrimaryPart.Position).Magnitude >
            this.attributes.MaxDistance
        ) {
          this.clear()
          return
        }
        if (mouse.Target === baseplate) {
          this.midpoint = getMeshMidpointFromWorldPosition(
            new Vector3(
              math.floor(mouse.Hit.X) + 0.5,
              (baseplate.Size.Y + gridSpacing) / 2 + baseplate.Position.Y,
              math.floor(mouse.Hit.Z) + 0.5,
            ),
            baseplate,
          )
        } else if (
          mouse.Target &&
          mouse.Target.Parent &&
          mouse.Target.Parent === placedBlocksFolder
        ) {
          /* */
        } else {
          this.clear()
          return
        }
        if (this.midpoint) {
          this.preview =
            this.preview ||
            ReplicatedStorage.Items?.FindFirstChild<Model>(
              item.name,
            )?.Clone() ||
            ReplicatedStorage.Common.PlaceBlockPreview.Clone()
          this.preview.PivotTo(
            getCFrameFromMeshMidpoint(
              this.midpoint,
              this.rotation,
              baseplate,
              new Vector3(item.width, item.height, item.length),
            ),
          )
          this.preview.Parent = previewBlockFolder
        }
      })
    })

    this.instance.Unequipped.Connect(() => {
      this.placeBlockController.equipPlaceBlockTool(undefined)
      this.connection?.Disconnect()
      this.connection = undefined
      this.midpoint = undefined
      this.preview?.Destroy()
      this.preview = undefined
    })

    this.instance.Activated.Connect(() => {
      const item = this.placeBlockController.getItem()
      if (item && this.midpoint && !this.invoking) {
        this.invoking = true
        Functions.placeBlock.invoke(item.name, this.midpoint, this.rotation)
        this.invoking = false
      }
    })
  }
}
