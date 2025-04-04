import { lerp } from '@rbxts/pretty-react-hooks'
import { TweenService } from '@rbxts/services'
import { ANIMATIONS } from 'ReplicatedStorage/shared/constants/core'
import { Animating } from 'StarterPlayer/StarterPlayerScripts/controllers/AnimationController'

export interface AnimatingBreakBlock extends Animating {
  type: 'BreakBlock'
  startValue: number
  endValue: number
  onTick: (animating: AnimatingBreakBlock) => void
}

export function animateBreakBlock(animating: AnimatingBreakBlock) {
  const value = TweenService.GetValue(
    math.min(animating.elapsed / animating.duration, 1),
    Enum.EasingStyle.Bounce,
    Enum.EasingDirection.InOut,
  )
  animating.model.ScaleTo(lerp(animating.startValue, animating.endValue, value))
}

export function startBreakBlockAnimation(model: Model): AnimatingBreakBlock {
  return {
    type: ANIMATIONS.BreakBlock,
    model,
    elapsed: 0,
    duration: 1,
    startValue: 0.5,
    endValue: 1,
    onTick: animateBreakBlock,
  }
}
