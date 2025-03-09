import { OnStart, Service } from '@flamework/core'
import { Logger } from '@rbxts/log'
import { ReplicatedStorage, Workspace } from '@rbxts/services'
import { INVENTORY } from 'ReplicatedStorage/shared/constants/core'
import { getCFrameFromMeshMidpoint } from 'ReplicatedStorage/shared/utils/mesh'
import { Functions } from 'ServerScriptService/network'
import { PlayerService } from 'ServerScriptService/services/PlayerService'

@Service()
export class PlaceBlockService implements OnStart {
  constructor(
    private playerService: PlayerService,
    protected readonly logger: Logger,
  ) {}

  onStart() {
    Functions.placeBlock.setCallback((player, itemName, location, rotation) => {
      const item = INVENTORY[itemName]
      if (!item) {
        this.logger.Error(
          `PlaceBlockService.placeBlock: Item ${itemName} unknown`,
        )
      }
      const templateModel =
        ReplicatedStorage.Items.FindFirstChild<Model>(itemName)
      if (!templateModel) {
        this.logger.Error(
          `PlaceBlockService.placeBlock: Item ${itemName} not found`,
        )
        return
      }
      const clonedModel = templateModel.Clone()
      const playerSpace = this.playerService.getPlayerSpace(player)
      const clonedSound = Workspace.Audio.BlockPlaced.Clone()
      clonedModel.PivotTo(
        getCFrameFromMeshMidpoint(
          location,
          rotation,
          playerSpace.Plot.Baseplate,
          new Vector3(item.X, item.Y, item.Z),
        ),
      )
      clonedSound.Parent = clonedModel
      clonedModel.Parent = playerSpace.PlacedBlocks
      clonedSound.Play()
    })

    Functions.breakBlock.setCallback((player, target) => {
      const playerSpace = this.playerService.getPlayerSpace(player)
      if (!typeIs(target, 'Instance') || !target.IsA('Part')) return
      const clonedSoundBlock = new Instance('Part')
      clonedSoundBlock.Size = new Vector3(3, 3, 3)
      clonedSoundBlock.CFrame = target.CFrame
      const clonedSound = Workspace.Audio.BlockBroken.Clone()
      clonedSound.Ended.Connect(() => clonedSoundBlock.Destroy())
      clonedSound.Parent = clonedSoundBlock
      clonedSoundBlock.Parent = playerSpace.PlaceBlockPreview
      clonedSound.Play()
      target.Destroy()
    })
  }
}
