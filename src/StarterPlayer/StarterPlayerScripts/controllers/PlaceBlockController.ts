import { Controller, OnStart } from '@flamework/core'
import { Logger } from '@rbxts/log'
import { UserInputService } from '@rbxts/services'
import { PlaceBlockToolComponent } from 'StarterPlayer/StarterPlayerScripts/components/PlaceBlockTool'
import { PlayerController } from 'StarterPlayer/StarterPlayerScripts/controllers/PlayerController'

@Controller({})
export class PlaceBlockController implements OnStart {
  activePlaceBlockTool?: PlaceBlockToolComponent

  constructor(
    protected playerController: PlayerController,
    protected logger: Logger,
  ) {}

  equipPlaceBlockTool(tool?: PlaceBlockToolComponent) {
    this.activePlaceBlockTool = tool
  }

  onStart() {
    UserInputService.InputBegan.Connect((inputObject, processed) => {
      if (this.activePlaceBlockTool && !processed) {
        if (inputObject.UserInputType === Enum.UserInputType.Keyboard) {
          switch (inputObject.KeyCode) {
            case Enum.KeyCode.R:
              break
          }
        }
      }
    })
  }

  getFolders() {
    const playerSpace = this.playerController.getPlayerSpace()
    const baseplateSize = playerSpace.Plot.Baseplate.Size
    if (baseplateSize.X % 6 !== 0)
      this.logger.Error(
        `Baseplate size ${baseplateSize.X} should be a multiple of 6`,
      )
    if (baseplateSize.Z % 6 !== 0)
      this.logger.Error(
        `Baseplate size ${baseplateSize.Z} should be a multiple of 6`,
      )

    return {
      baseplate: playerSpace.Plot.Baseplate,
      placedBlocksFolder: playerSpace.PlacedBlocks,
      previewBlockFolder: playerSpace.PlaceBlockPreview,
    }
  }
}
