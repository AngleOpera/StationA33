import { TweenService } from '@rbxts/services'
import { ANIMATIONS, Step } from 'ReplicatedStorage/shared/constants/core'
import { getStepVector } from 'ReplicatedStorage/shared/utils/core'
import { gridSpacing } from 'ReplicatedStorage/shared/utils/mesh'
import { Animating } from 'StarterPlayer/StarterPlayerScripts/controllers/AnimationController'

export interface AnimatingMoveModel extends Animating {
  type: 'MoveModel'
  startCFrame: CFrame
  endCFrame: CFrame
  onTick: (animating: AnimatingMoveModel) => void
}

export function animateMoveModel(animating: AnimatingMoveModel) {
  const value = TweenService.GetValue(
    math.min(animating.elapsed / animating.duration, 1),
    Enum.EasingStyle.Linear,
    Enum.EasingDirection.Out,
  )
  animating.model.PivotTo(
    animating.startCFrame.Lerp(animating.endCFrame, value),
  )
}

export function startMoveModelAnimation(
  model: Model,
  endCFrame: CFrame,
): AnimatingMoveModel {
  return {
    type: ANIMATIONS.MoveModel,
    model,
    elapsed: 0,
    duration: 0.25,
    startCFrame: model.GetPivot(),
    endCFrame,
    onTick: animateMoveModel,
  }
}

export function createStepModelAnimation(
  model: Model,
  baseplate: BasePart,
  step: Step,
) {
  return () =>
    startMoveModelAnimation(
      model,
      baseplate.CFrame.ToWorldSpace(
        baseplate.CFrame.ToObjectSpace(model.GetPivot()).add(
          getStepVector(step).mul(gridSpacing),
        ),
      ),
    )
}
