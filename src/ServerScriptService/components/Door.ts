import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { DoorTag } from 'ReplicatedStorage/shared/constants/tags'
import { PlayerService } from 'ServerScriptService/services/PlayerService'

@Component({ tag: DoorTag })
export class DoorComponent extends BaseComponent<{}, Door> implements OnStart {
  constructor(private playerService: PlayerService) {
    super()
  }

  onStart() {
    this.instance.ClickDetector.MouseClick.Connect(() => {
      print('open door')
    })
  }
}
