import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { DoorTag } from 'ReplicatedStorage/shared/constants/tags'

@Component({ tag: DoorTag })
export class DoorComponent extends BaseComponent<{}, Door> implements OnStart {
  material: Enum.Material
  color: Color3

  constructor() {
    super()
    this.color = Color3.fromRGB(255, 255, 255)
    this.material = Enum.Material.Plastic
  }

  onStart() {
    this.color = this.instance.Color
    this.material = this.instance.Material

    this.instance.ClickDetector.MouseHoverEnter.Connect(() => {
      this.instance.Color = Color3.fromRGB(0, 255, 0)
      this.instance.Material = Enum.Material.Neon
    })
    this.instance.ClickDetector.MouseHoverLeave.Connect(() => {
      this.instance.Color = this.color
      this.instance.Material = this.material
    })
    this.instance.ClickDetector.MouseClick.Connect(() => {
      // print('open door')
    })
  }
}
