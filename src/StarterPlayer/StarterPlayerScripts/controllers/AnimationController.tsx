import { Controller, OnStart, OnTick } from '@flamework/core'
import { Logger } from '@rbxts/log'
import { Workspace } from '@rbxts/services'
import {
  ANIMATIONS,
  BLOCK_ID_LOOKUP,
} from 'ReplicatedStorage/shared/constants/core'
import { cloneBlock } from 'ReplicatedStorage/shared/utils/block'
import {
  getEntityStepFromEncodedStep,
  getStepVector,
} from 'ReplicatedStorage/shared/utils/core'
import { findDescendentWithPath } from 'ReplicatedStorage/shared/utils/instance'
import {
  decodeMeshMidpoint,
  meshRotation0,
} from 'ReplicatedStorage/shared/utils/mesh'
import {
  AnimatingBreakBlock,
  startBreakBlockAnimation,
} from 'StarterPlayer/StarterPlayerScripts/animations/BreakBlock'
import {
  AnimatingMoveModel,
  startMoveModelAnimation,
} from 'StarterPlayer/StarterPlayerScripts/animations/MoveModel'
import { PlayerController } from 'StarterPlayer/StarterPlayerScripts/controllers/PlayerController'
import { Events } from 'StarterPlayer/StarterPlayerScripts/network'

export interface Animating {
  model: Model
  elapsed: number
  duration: number
}

export type AnimatingType = AnimatingBreakBlock | AnimatingMoveModel

@Controller({})
export class AnimationController implements OnStart, OnTick {
  animating: AnimatingType[] = []

  constructor(
    protected readonly playerController: PlayerController,
    protected readonly logger: Logger,
  ) {}

  onStart() {
    Events.animate.connect((animation, path) => {
      try {
        this.handleAnimate(animation, path)
      } catch (e) {
        this.logger.Error(`AnimationController.animate: ${e}`)
      }
    })
    Events.animateNewItem.connect(
      (itemType, encodedMidpoint, encodedEntityStep) => {
        try {
          this.handleAnimateNewItem(
            itemType,
            encodedMidpoint,
            encodedEntityStep,
          )
        } catch (e) {
          this.logger.Error(`AnimationController.handleAnimateNewItem: ${e}`)
        }
      },
    )
    Events.animateMoveItems.connect((encodedEntitySteps) => {
      try {
        this.handleAnimateMoveItems(encodedEntitySteps)
      } catch (e) {
        this.logger.Error(`AnimationController.handleAnimateMoveItems: ${e}`)
      }
    })
    Events.animateRemoveItem.connect((entity) => {
      try {
        this.handleAnimateRemoveItem(entity)
      } catch (e) {
        this.logger.Error(`AnimationController.handleAnimateRemoveItem: ${e}`)
      }
    })
  }

  onTick(dt: number) {
    let someAnimationFinished = false
    for (const animating of this.animating) {
      animating.elapsed += dt
      // XXX how to improve type safety?
      animating.onTick(animating as never)
      if (animating.elapsed >= animating.duration) someAnimationFinished = true
    }
    if (someAnimationFinished) {
      this.animating = this.animating.filter((animating) => {
        return animating.elapsed < animating.duration
      })
    }
  }

  handleAnimate(animation: string, path: string[]) {
    const model = findDescendentWithPath(Workspace, path)
    if (!model?.IsA('Model')) {
      this.logger.Warn(
        `handleAnimate: Could not find model at path ${path.join('/')}`,
      )
      return
    }
    switch (animation) {
      case ANIMATIONS.BreakBlock:
        this.animating.push(startBreakBlockAnimation(model))
        break
    }
  }

  handleAnimateNewItem(
    itemType: number,
    encodedMidpoint: string,
    encodedEntityStep: number,
  ) {
    const item = BLOCK_ID_LOOKUP[itemType]
    if (!item) {
      this.logger.Warn(`handleAnimateNewItem: Item ${itemType} not found`)
      return
    }
    const playerSpace = this.playerController.getPlayerSpace()
    const { entity } = getEntityStepFromEncodedStep(encodedEntityStep)
    const model = cloneBlock(
      item,
      decodeMeshMidpoint(encodedMidpoint),
      meshRotation0,
      playerSpace.Plot.Baseplate,
      { ignoreExisting: true },
    )
    if (!model) return
    model.Name = `Item${entity}`
    model.Parent = Workspace.Animating.Items
    this.handleAnimateMoveItems([encodedEntityStep])
  }

  handleAnimateMoveItems(encodedEntityStep: number[]) {
    const baseplate = this.playerController.getPlayerSpace().Plot.Baseplate
    for (const entityStep of encodedEntityStep) {
      const { entity, step } = getEntityStepFromEncodedStep(entityStep)
      const model = Workspace.Animating.Items.FindFirstChild<Model>(
        `Item${entity}`,
      )
      if (!model) continue
      this.animating.push(
        startMoveModelAnimation(
          model,
          baseplate.CFrame.ToWorldSpace(
            baseplate.CFrame.ToObjectSpace(model.GetPivot()).add(
              getStepVector(step),
            ),
          ),
        ),
      )
    }
  }

  handleAnimateRemoveItem(entity: number) {
    Workspace.Animating.Items.FindFirstChild(`Item${entity}`)?.Destroy()
  }
}
