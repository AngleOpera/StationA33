import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { DoorTag } from 'ReplicatedStorage/shared/constants/tags'
import { PlayerService } from 'ServerScriptService/services/PlayerService'

@Component({ tag: DoorTag })
export class DoorComponent
  extends BaseComponent<{}, BasePart>
  implements OnStart
{
  material: Enum.Material
  //color: Color3

  constructor(private playerService: PlayerService) {
    super()
    //this.color = Color3.fromRGB(255, 255, 255)
    this.material = Enum.Material.Plastic
  }

  onStart() {
    //this.color = this.instance.Color
    this.material = this.instance.Material
    const clickDetector = new Instance('ClickDetector')
    clickDetector.Parent = this.instance
    clickDetector.MouseHoverEnter.Connect(() => {
      //this.instance.Color = Color3.fromRGB(0, 255, 0)
      this.instance.Material = Enum.Material.Neon
    })
    clickDetector.MouseHoverLeave.Connect(() => {
      //this.instance.Color = this.color
      this.instance.Material = this.material
    })
    clickDetector.MouseClick.Connect(() => {
      print('open door')
    })
  }
}
