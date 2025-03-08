import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { Players, ReplicatedStorage, RunService } from '@rbxts/services'
import { InventoryItemName } from 'ReplicatedStorage/shared/constants/core'
import { PlaceBlockToolTag } from 'ReplicatedStorage/shared/constants/tags'
import {
  getCFrameFromPlacementLocation,
  getPlacementLocationFromWorldPosition,
  PlacementLocation,
} from 'ReplicatedStorage/shared/utils/placement'
import { PlaceBlockController } from 'StarterPlayer/StarterPlayerScripts/controllers/PlaceBlockController'
import { Functions } from 'StarterPlayer/StarterPlayerScripts/network'

@Component({ tag: PlaceBlockToolTag })
export class PlaceBlockToolComponent
  extends BaseComponent<PlaceBlockToolAttributes, PlaceBlockTool>
  implements OnStart
{
  itemName: InventoryItemName = 'Conveyor'
  connection: RBXScriptConnection | undefined
  location: PlacementLocation | undefined
  preview: BasePart | Model | undefined
  placing = false

  constructor(protected placeBlockController: PlaceBlockController) {
    super()
  }

  onStart() {
    const { baseplate, previewBlockFolder } =
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
          mouse.Target !== baseplate ||
          mouse.Hit.Position.sub(character.PrimaryPart.Position).Magnitude >
            this.attributes.MaxDistance
        ) {
          return
        }
        this.location = getPlacementLocationFromWorldPosition(
          math.floor(mouse.Hit.X) + 0.5,
          math.floor(mouse.Hit.Z) + 0.5,
          baseplate,
        )
        this.preview =
          this.preview ||
          ReplicatedStorage.Items?.FindFirstChild<Model>(
            this.itemName,
          )?.Clone() ||
          ReplicatedStorage.Common.PlaceBlockPreview.Clone()
        this.preview.PivotTo(
          getCFrameFromPlacementLocation(this.location, baseplate),
        )
        this.preview.Parent = previewBlockFolder
      })
    })

    this.instance.Unequipped.Connect(() => {
      this.placeBlockController.equipPlaceBlockTool(undefined)
      this.connection?.Disconnect()
      this.connection = undefined
      this.location = undefined
      this.preview?.Destroy()
      this.preview = undefined
    })

    this.instance.Activated.Connect(() => {
      if (this.location && !this.placing) {
        this.placing = true
        Functions.placeBlock.invoke(this.itemName, this.location)
        this.placing = false
      }
    })
  }
}
