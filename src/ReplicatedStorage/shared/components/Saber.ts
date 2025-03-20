import { Component } from '@flamework/components'
import { SwingerComponent } from 'ReplicatedStorage/shared/components/Swinger'
import { SWINGS } from 'ReplicatedStorage/shared/constants/swings'
import { SaberTag } from 'ReplicatedStorage/shared/constants/tags'

@Component({ tag: SaberTag })
export class SaberComponent extends SwingerComponent {
  getSwing() {
    if (!this.humanoid || !this.torso) return undefined
    const forward = this.humanoid.MoveDirection.Dot(
      this.torso.CFrame.LookVector,
    )
    const right = this.humanoid.MoveDirection.Dot(this.torso.CFrame.RightVector)
    if (right > 0.5) {
      return SWINGS.Right
    } else if (right < -0.5) {
      return SWINGS.Left
    } else if (forward > 0.5) {
      return SWINGS.Lunge
    } else {
      return SWINGS.Slash
    }
  }
}
