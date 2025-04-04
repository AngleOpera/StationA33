import { Controller, OnStart } from '@flamework/core'
import { Logger } from '@rbxts/log'
import { Players, UserInputService, Workspace } from '@rbxts/services'
import {
  INVENTORY,
  InventoryItemDescription,
  InventoryItemName,
} from 'ReplicatedStorage/shared/constants/core'
import { getCharacter } from 'ReplicatedStorage/shared/utils/player'
import { PlaceBlockToolComponent } from 'StarterPlayer/StarterPlayerScripts/components/PlaceBlockTool'
import { PlayerController } from 'StarterPlayer/StarterPlayerScripts/controllers/PlayerController'
import { store } from 'StarterPlayer/StarterPlayerScripts/store'
import { MENU_PAGE } from 'StarterPlayer/StarterPlayerScripts/store/MenuState'

export interface PlaceBlockPlot {
  plotId: string
  baseplate: BasePart
  placedBlocksFolder: Model
}

@Controller({})
export class PlaceBlockController implements OnStart {
  item: InventoryItemDescription = INVENTORY['Conveyor']
  activePlaceBlockTool?: PlaceBlockToolComponent

  constructor(
    protected playerController: PlayerController,
    protected logger: Logger,
  ) {}

  onStart() {
    UserInputService.InputBegan.Connect((inputObject, processed) => {
      if (this.activePlaceBlockTool) {
        if (inputObject.UserInputType === Enum.UserInputType.Keyboard) {
          switch (inputObject.KeyCode) {
            case Enum.KeyCode.Escape:
              store.setMenuOpen(false)
              break
            case Enum.KeyCode.R:
              if (this.activePlaceBlockTool && !processed) {
                this.activePlaceBlockTool.rotate()
              }
              break
            case Enum.KeyCode.V:
            case Enum.KeyCode.X:
              if (!processed) store.setMenuOpen(false)
              break
          }
        }
      }
    })
  }

  handlePlaceBlockToolEquipped(tool?: PlaceBlockToolComponent) {
    this.activePlaceBlockTool = tool
    if (tool) store.setMenuPage(MENU_PAGE.Inventory)
    else store.closeMenuPage(MENU_PAGE.Inventory)
  }

  unequipPlaceBlockTool() {
    if (this.activePlaceBlockTool)
      getCharacter(Players.LocalPlayer)?.Humanoid?.UnequipTools()
  }

  getItem() {
    return this.item
  }

  setItem(name: InventoryItemName) {
    const item = INVENTORY[name]
    if (!item) {
      this.logger.Error(`PlaceBlockController.setItem: Item ${name} unknown`)
      return
    }
    this.item = item
  }

  getFolders(): {
    placeBlockPlots: PlaceBlockPlot[]
    previewBlockFolder: Model
  } {
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
      placeBlockPlots: [
        {
          plotId: '0',
          baseplate: Workspace.PlayerSpaces['0'].Plot.Baseplate,
          placedBlocksFolder: Workspace.PlayerSpaces['0'].PlacedBlocks,
        },
        {
          plotId: `${Players.LocalPlayer.UserId}`,
          baseplate: playerSpace.Plot.Baseplate,
          placedBlocksFolder: playerSpace.PlacedBlocks,
        },
      ],
      previewBlockFolder: playerSpace.PlaceBlockPreview,
    }
  }
}
