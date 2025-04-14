import { Controller, OnStart, Service } from '@flamework/core'
import { Logger } from '@rbxts/log'
import { UserInputService } from '@rbxts/services'
import { IS_SERVER } from 'ReplicatedStorage/shared/constants/core'

@Controller()
@Service()
export class InputTracker implements OnStart {
  mouse1Down = false

  constructor(protected readonly logger: Logger) {}

  onStart() {
    if (IS_SERVER) return

    UserInputService.InputBegan.Connect((inputObject, _gameHandledEvent) => {
      if (inputObject.UserInputType === Enum.UserInputType.MouseButton1) {
        this.mouse1Down = true
      }
    })

    UserInputService.InputEnded.Connect((inputObject, _gameHandledEvent) => {
      if (inputObject.UserInputType === Enum.UserInputType.MouseButton1) {
        this.mouse1Down = false
      }
    })
  }
}
