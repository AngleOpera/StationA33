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
    let debounce = false
    this.instance.ClickDetector.MouseClick.Connect(() => {
      if (debounce) return
      debounce = true
      // print('open door')
      this.instance.Destroy()
      wait(0.1)
      debounce = false
    })
  }
}
