import { BaseComponent, Component } from '@flamework/components'
import { OnTick } from '@flamework/core'
import { SpinTag } from 'ReplicatedStorage/shared/constants/tags'

@Component({ tag: SpinTag })
export class SpinComponent
  extends BaseComponent<{}, BasePart>
  implements OnTick
{
  onTick() {
    this.instance.CFrame = this.instance.CFrame.mul(CFrame.Angles(0, 0, 0.1))
  }
}
