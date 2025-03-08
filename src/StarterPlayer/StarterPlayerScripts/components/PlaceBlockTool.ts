import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { Players, ReplicatedStorage, RunService } from '@rbxts/services'
import {
  INVENTORY,
  InventoryItemDescription,
} from 'ReplicatedStorage/shared/constants/core'
import { PlaceBlockToolTag } from 'ReplicatedStorage/shared/constants/tags'
import {
  blockSize,
  getCFrameFromMeshMidpoint,
  getMeshMidpointFromWorldPosition,
  MeshMidPoint,
  MeshRotation,
} from 'ReplicatedStorage/shared/utils/mesh'
import { PlaceBlockController } from 'StarterPlayer/StarterPlayerScripts/controllers/PlaceBlockController'
import { Functions } from 'StarterPlayer/StarterPlayerScripts/network'

@Component({ tag: PlaceBlockToolTag })
export class PlaceBlockToolComponent
  extends BaseComponent<PlaceBlockToolAttributes, PlaceBlockTool>
  implements OnStart
{
  item: InventoryItemDescription = INVENTORY['Conveyor']
  connection: RBXScriptConnection | undefined
  block: MeshMidPoint | undefined
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
    this.block = undefined
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
        if (
          !character.PrimaryPart ||
          humanoid.Health <= 0 ||
          mouse.Hit.Position.sub(character.PrimaryPart.Position).Magnitude >
            this.attributes.MaxDistance
        ) {
          this.clear()
          return
        }
        if (mouse.Target === baseplate) {
          this.block = getMeshMidpointFromWorldPosition(
            new Vector3(
              math.floor(mouse.Hit.X) + 0.5,
              (baseplate.Size.Y + blockSize) / 2 + baseplate.Position.Y,
              math.floor(mouse.Hit.Z) + 0.5,
            ),
            new Vector3(this.item.X, this.item.Y, this.item.Z),
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
        if (this.block) {
          this.preview =
            this.preview ||
            ReplicatedStorage.Items?.FindFirstChild<Model>(
              this.item.name,
            )?.Clone() ||
            ReplicatedStorage.Common.PlaceBlockPreview.Clone()
          this.preview.PivotTo(
            getCFrameFromMeshMidpoint(this.block, this.rotation, baseplate),
          )
          this.preview.Parent = previewBlockFolder
        }
      })
    })

    this.instance.Unequipped.Connect(() => {
      this.placeBlockController.equipPlaceBlockTool(undefined)
      this.connection?.Disconnect()
      this.connection = undefined
      this.block = undefined
      this.preview?.Destroy()
      this.preview = undefined
    })

    this.instance.Activated.Connect(() => {
      if (this.block && !this.invoking) {
        this.invoking = true
        Functions.placeBlock.invoke(this.item.name, this.block, this.rotation)
        this.invoking = false
      }
    })
  }
}
