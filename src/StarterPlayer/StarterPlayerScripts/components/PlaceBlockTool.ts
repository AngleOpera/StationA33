import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import {
  Players,
  ReplicatedStorage,
  RunService,
  Workspace,
} from '@rbxts/services'
import {
  InventoryItemDescription,
  TYPE,
} from 'ReplicatedStorage/shared/constants/core'
import { PlaceBlockToolTag } from 'ReplicatedStorage/shared/constants/tags'
import { selectLocalPlayerState } from 'ReplicatedStorage/shared/state'
import {
  getExactOffsetForSurface,
  getItemVector3,
  getRotatedPoint,
  getRotatedSize,
  getRotatedSurface,
  gridSpacing,
  Rotation,
  rotation0,
} from 'ReplicatedStorage/shared/utils/core'
import {
  findDescendentsWhichAre,
  grandParentIs,
} from 'ReplicatedStorage/shared/utils/instance'
import {
  decodeMeshMidpoint,
  getCFrameFromMeshMidpoint,
  getMeshDataFromModel,
  getMeshMidpointFromWorldPosition,
  getVoxelMidpointFromExactMidpointOffset,
  MeshMidpoint,
  validMeshMidpoint,
} from 'ReplicatedStorage/shared/utils/mesh'
import { createBoundingPart } from 'ReplicatedStorage/shared/utils/part'
import { getCharacter } from 'ReplicatedStorage/shared/utils/player'
import {
  PlaceBlockController,
  PlaceBlockPlot,
} from 'StarterPlayer/StarterPlayerScripts/controllers/PlaceBlockController'
import { Functions } from 'StarterPlayer/StarterPlayerScripts/network'
import { store } from 'StarterPlayer/StarterPlayerScripts/store'

@Component({ tag: PlaceBlockToolTag })
export class PlaceBlockToolComponent
  extends BaseComponent<PlaceBlockToolAttributes, PlaceBlockTool>
  implements OnStart
{
  connection: RBXScriptConnection | undefined
  plot: PlaceBlockPlot | undefined
  midpoint: MeshMidpoint | undefined
  rotation: Rotation = rotation0
  item: InventoryItemDescription | undefined
  preview: BasePart | Model | undefined
  bounding: BasePart | undefined
  overlapParams = new OverlapParams()
  conflicting = false
  invoking = false

  constructor(protected placeBlockController: PlaceBlockController) {
    super()
  }

  rotate() {
    this.rotation = new Vector3(0, (this.rotation.Y + 1) % 4, 0)
  }

  clear() {
    this.plot = undefined
    this.midpoint = undefined
    this.preview?.Destroy()
    this.preview = undefined
  }

  onStart() {
    this.overlapParams.CollisionGroup = 'Bounding'

    const { placeBlockPlots, previewBlockFolder } =
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
            this.attributes.MaxDistance ||
          !selectLocalPlayerState()(store.getState())?.inventory?.[item.name]
        ) {
          this.clear()
          return
        }

        this.plot = undefined
        this.midpoint = undefined

        for (const plot of placeBlockPlots) {
          const { baseplate, placedBlocksFolder } = plot

          if (mouse.Target === baseplate) {
            this.plot = plot
            this.midpoint = getMeshMidpointFromWorldPosition(
              new Vector3(
                math.floor(mouse.Hit.X) + 0.5,
                baseplate.Position.Y + baseplate.Size.Y / 2,
                math.floor(mouse.Hit.Z) + 0.5,
              ),
              baseplate,
            )
            break
          } else if (
            mouse.Target &&
            grandParentIs(mouse.Target, placedBlocksFolder) &&
            mouse.Target.Parent?.IsA('Model') &&
            item.stackable
          ) {
            const targetModel = mouse.Target.Parent
            const targetMidpoint = decodeMeshMidpoint(targetModel.Name)
            const {
              rotation: targetRotation,
              item: targetItem,
              size: targetMeshSize,
            } = getMeshDataFromModel(targetModel, baseplate)
            if (!targetItem) break

            const targetRotatedHit = getRotatedPoint(
              targetModel
                .GetPivot()
                .ToObjectSpace(new CFrame(mouse.Hit.Position)).Position,
              targetRotation,
            )
            const targetRotatedSize = getRotatedSize(
              targetMeshSize,
              targetRotation,
            )
            const itemRotatedSize = getRotatedSize(
              getItemVector3(item.size),
              this.rotation,
            )

            this.plot = plot
            this.midpoint = getVoxelMidpointFromExactMidpointOffset(
              targetMidpoint,
              targetRotatedSize,
              targetRotation,
              getExactOffsetForSurface(
                getRotatedSurface(mouse.TargetSurface, targetRotation.mul(-1)),
                targetRotatedHit,
                targetRotatedSize,
                itemRotatedSize,
              ),
            )
            break
          }
        }

        if (!this.plot || !this.midpoint || !validMeshMidpoint(this.midpoint)) {
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
          findDescendentsWhichAre<BasePart>(
            this.preview,
            TYPE.BasePart,
          ).forEach((part) => {
            part.CanCollide = false
            part.Transparency = 0.5
          })
          findDescendentsWhichAre<ProximityPrompt>(
            this.preview,
            TYPE.ProximityPrompt,
          ).forEach((prompt) => {
            prompt.Enabled = false
          })
          this.bounding = createBoundingPart(
            this.preview.GetPivot().Position,
            getItemVector3(item.size).mul(gridSpacing * 0.99),
            this.preview,
          )
        }

        this.preview.PivotTo(
          getCFrameFromMeshMidpoint(
            this.midpoint,
            getItemVector3(item.size),
            this.rotation,
            this.plot.baseplate,
          ),
        )
        this.conflicting =
          !!this.bounding &&
          Workspace.GetPartsInPart(this.bounding, this.overlapParams).size() > 0
        this.preview.Parent = this.conflicting ? undefined : previewBlockFolder
      })
    })

    this.instance.Unequipped.Connect(() => {
      this.placeBlockController.handlePlaceBlockToolEquipped(undefined)
      this.connection?.Disconnect()
      this.connection = undefined
      this.plot = undefined
      this.midpoint = undefined
      this.item = undefined
      this.preview?.Destroy()
      this.preview = undefined
      this.bounding?.Destroy()
      this.bounding = undefined
    })

    this.instance.Activated.Connect(async () => {
      const item = this.placeBlockController.getItem()
      if (item && this.plot && this.midpoint && !this.invoking) {
        this.invoking = true
        await Functions.placeBlock.invoke(
          item.name,
          this.plot.plotId,
          this.midpoint,
          this.rotation,
        )
        this.invoking = false
      }
    })
  }
}
