import { Component } from '@flamework/components'
import { SaberTag } from 'ReplicatedStorage/shared/constants/tags'
import {
  Swing,
  SwingerComponent,
} from 'StarterPlayer/StarterPlayerScripts/components/Swinger'

@Component({ tag: SaberTag })
export class SaberComponent extends SwingerComponent {
  swings: Record<string, Swing> = {
    Slash: {
      name: 'Slash',
      baseDamage: 85,
      r15animationId: 522635514,
    },
    Left: {
      name: 'Left',
      baseDamage: 97,
      r15animationId: 17734827634,
      soundName: 'SwordSlash',
    },
    Lunge: {
      name: 'Lunge',
      baseDamage: 105,
      r15animationId: 522638767,
      soundName: 'SwordSlash',
    },
    Right: {
      name: 'Right',
      baseDamage: 90,
      r15animationId: 17734841566,
      soundName: 'SwordLunge',
    },
  }

  getSwing() {
    if (!this.humanoid || !this.torso) return undefined
    const forward = this.humanoid.MoveDirection.Dot(
      this.torso.CFrame.LookVector,
    )
    const right = this.humanoid.MoveDirection.Dot(this.torso.CFrame.RightVector)
    if (right > 0.5) {
      return this.swings.Right
    } else if (right < -0.5) {
      return this.swings.Left
    } else if (forward > 0.5) {
      return this.swings.Lunge
    } else {
      return this.swings.Slash
    }
  }
}
