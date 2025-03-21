import { Controller, OnStart, OnTick } from '@flamework/core'
import { Logger } from '@rbxts/log'
import { TweenService, Workspace } from '@rbxts/services'
import { findDescendentWithPath } from 'ReplicatedStorage/shared/utils/instance'
import { lerp } from 'ReplicatedStorage/shared/utils/math'
import { Events } from 'StarterPlayer/StarterPlayerScripts/network'

export interface Animating {
  model: Model
  elapsed: number
  duration: number
  startValue: number
  endValue: number
}

@Controller({})
export class AnimationController implements OnStart, OnTick {
  animating: Animating[] = []

  constructor(protected readonly logger: Logger) {}

  onStart() {
    Events.animate.connect((animation, path) =>
      this.handleAnimate(animation, path),
    )
  }

  onTick(dt: number) {
    let someAnimationFinished = false
    for (const animating of this.animating) {
      animating.elapsed += dt
      const value = TweenService.GetValue(
        math.min(animating.elapsed / animating.duration, 1),
        Enum.EasingStyle.Linear,
        Enum.EasingDirection.Out,
      )
      animating.model.ScaleTo(
        lerp(animating.startValue, animating.endValue, value),
      )
      if (animating.elapsed >= animating.duration) someAnimationFinished = true
    }
    if (someAnimationFinished) {
      this.animating = this.animating.filter((animating) => {
        return animating.elapsed < animating.duration
      })
    }
  }

  handleAnimate(_animation: string, path: string[]) {
    const model = findDescendentWithPath(Workspace, path)
    if (!model?.IsA('Model')) {
      this.logger.Warn(`Could not find model at path ${path.join('/')}`)
      return
    }
    this.animating.push({
      model,
      elapsed: 0,
      duration: 1,
      startValue: 1,
      endValue: 0.5,
    })
  }
}
