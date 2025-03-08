import { OnStart, Service } from '@flamework/core'
import { Logger } from '@rbxts/log'
import { ReplicatedStorage, Workspace } from '@rbxts/services'
import { getCFrameFromPlacementLocation } from 'ReplicatedStorage/shared/utils/placement'
import { Functions } from 'ServerScriptService/network'
import { PlayerService } from 'ServerScriptService/services/PlayerService'

@Service()
export class PlaceBlockService implements OnStart {
  constructor(
    private playerService: PlayerService,
    protected readonly logger: Logger,
  ) {}

  onStart() {
    Functions.placeBlock.setCallback((player, itemName, location) => {
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
        getCFrameFromPlacementLocation(location, playerSpace.Plot.Baseplate),
      )
      clonedSound.Parent = clonedModel
      clonedModel.Parent =
        this.playerService.getPlayerSpace(player).PlacedBlocks
      clonedSound.Play()
    })

    Functions.breakBlock.setCallback((player, target) => {
      xpcall(
        () => {
          const playerSpace = this.playerService.getPlayerSpace(player)
          if (!typeIs(target, 'Instance') || !target.IsA('Part')) return
          if (target.Name !== 'Block') {
            player.Kick('Stop exploiting AAA! ' + target.Name)
            return false
          }
          const clonedSoundBlock = new Instance('Part')
          clonedSoundBlock.Size = new Vector3(3, 3, 3)
          clonedSoundBlock.CFrame = target.CFrame
          const clonedSound = Workspace.Audio.BlockBroken.Clone()
          clonedSound.Ended.Connect(() => clonedSoundBlock.Destroy())
          clonedSound.Parent = clonedSoundBlock
          clonedSoundBlock.Parent = playerSpace.PlaceBlockPreview
          clonedSound.Play()
          target.Destroy()
        },
        () => {
          player.Kick('Stop exploiting ZZZ!')
        },
      )
    })
  }
}
