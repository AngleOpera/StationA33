import { Controller, OnStart } from '@flamework/core'
import { Logger } from '@rbxts/log'
import { ProximityPromptService } from '@rbxts/services'
import { INVENTORY, USER_ID } from 'ReplicatedStorage/shared/constants/core'
import { findPlacedBlockFromDescendent } from 'ReplicatedStorage/shared/utils/core'
import { store } from 'StarterPlayer/StarterPlayerScripts/store'
import { MENU_PAGE } from 'StarterPlayer/StarterPlayerScripts/store/MenuState'

@Controller({})
export class ProximityController implements OnStart {
  constructor(protected readonly logger: Logger) {}

  onStart() {
    ProximityPromptService.PromptTriggered.Connect(
      (proximityPrompt, _player) => {
        if (proximityPrompt.ObjectText === INVENTORY.Container.name) {
          const { userId, encodedMidpoint } =
            findPlacedBlockFromDescendent(proximityPrompt)
          if (!userId || !encodedMidpoint) {
            this.logger.Error(
              `ProximityController: Couldn't find userId or encodedMidpoint of Container`,
            )
            return
          }
          if (userId !== USER_ID) return
          store.setMenuPage(MENU_PAGE.Inventory, true, encodedMidpoint)
        }
      },
    )
  }
}
