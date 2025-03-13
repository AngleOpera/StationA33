import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { Players, ReplicatedStorage, RunService } from '@rbxts/services'
import { InventoryItemDescription } from 'ReplicatedStorage/shared/constants/core'
import { PlaceBlockToolTag } from 'ReplicatedStorage/shared/constants/tags'
import {
  findDescendentsWhichAre,
  getCharacter,
  grandParentIs,
} from 'ReplicatedStorage/shared/utils/instance'
import {
  getCFrameFromMeshMidpoint,
  getMeshMidpointFromWorldPosition,
  gridSpacing,
  MeshMidpoint,
  MeshRotation,
  validMeshMidpoint,
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
  item: InventoryItemDescription | undefined
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
      this.placeBlockController.handlePlaceBlockToolEquipped(this)

      const character = getCharacter(Players.LocalPlayer)
      const humanoid = character?.Humanoid

      const mouse = Players.LocalPlayer.GetMouse()
      mouse.TargetFilter = previewBlockFolder

      this.connection = RunService.RenderStepped.Connect((_deltaTime) => {
        const item = this.placeBlockController.getItem()
        if (
          !item ||
          !humanoid ||
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
          grandParentIs(mouse.Target, placedBlocksFolder)
        ) {
          const mouseSurface = mouse.TargetSurface
          if (mouseSurface === Enum.NormalId.Left)
            this.midpoint = getMeshMidpointFromWorldPosition(
              mouse.Target.CFrame.ToWorldSpace(new CFrame(-gridSpacing, 0, 0))
                .Position,
              baseplate,
            )
          else if (mouseSurface === Enum.NormalId.Right)
            this.midpoint = getMeshMidpointFromWorldPosition(
              mouse.Target.CFrame.ToWorldSpace(new CFrame(gridSpacing, 0, 0))
                .Position,
              baseplate,
            )
          else if (mouseSurface === Enum.NormalId.Bottom)
            this.midpoint = getMeshMidpointFromWorldPosition(
              mouse.Target.CFrame.ToWorldSpace(new CFrame(0, -gridSpacing, 0))
                .Position,
              baseplate,
            )
          else if (mouseSurface === Enum.NormalId.Top)
            this.midpoint = getMeshMidpointFromWorldPosition(
              mouse.Target.CFrame.ToWorldSpace(new CFrame(0, gridSpacing, 0))
                .Position,
              baseplate,
            )
          else if (mouseSurface === Enum.NormalId.Front)
            this.midpoint = getMeshMidpointFromWorldPosition(
              mouse.Target.CFrame.ToWorldSpace(new CFrame(0, 0, -gridSpacing))
                .Position,
              baseplate,
            )
          else
            this.midpoint = getMeshMidpointFromWorldPosition(
              mouse.Target.CFrame.ToWorldSpace(new CFrame(0, 0, gridSpacing))
                .Position,
              baseplate,
            )
        } else {
          this.clear()
          return
        }
        if (this.midpoint) {
          if (!validMeshMidpoint(this.midpoint)) {
            this.clear()
            return
          }
          if (this.item !== item) {
            this.item = item
            this.preview?.Destroy()
            this.preview = undefined
          }
          if (!this.preview) {
            this.preview =
              ReplicatedStorage.Items?.FindFirstChild<Model>(
                item.name,
              )?.Clone() || ReplicatedStorage.Common.PlaceBlockPreview.Clone()
            findDescendentsWhichAre<BasePart>(this.preview, 'BasePart').forEach(
              (part) => {
                part.CanCollide = false
                part.Transparency = 0.5
              },
            )
          }
          this.preview.PivotTo(
            getCFrameFromMeshMidpoint(
              this.midpoint,
              new Vector3(item.width, item.height, item.length),
              this.rotation,
              baseplate,
            ),
          )
          if (!this.preview.Parent) this.preview.Parent = previewBlockFolder
        }
      })
    })

    this.instance.Unequipped.Connect(() => {
      this.placeBlockController.handlePlaceBlockToolEquipped(undefined)
      this.connection?.Disconnect()
      this.connection = undefined
      this.midpoint = undefined
      this.item = undefined
      this.preview?.Destroy()
      this.preview = undefined
    })

    this.instance.Activated.Connect(async () => {
      const item = this.placeBlockController.getItem()
      if (item && this.midpoint && !this.invoking) {
        this.invoking = true
        await Functions.placeBlock.invoke(
          item.name,
          this.midpoint,
          this.rotation,
        )
        this.invoking = false
      }
    })
  }
}
