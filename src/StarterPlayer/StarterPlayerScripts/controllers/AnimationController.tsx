import { Controller, OnStart, OnTick } from '@flamework/core'
import { Logger } from '@rbxts/log'
import Object from '@rbxts/object-utils'
import { Workspace } from '@rbxts/services'
import {
  ANIMATIONS,
  BLOCK_ID_LOOKUP,
} from 'ReplicatedStorage/shared/constants/core'
import { cloneBlock } from 'ReplicatedStorage/shared/utils/block'
import {
  decodeEntityStep,
  EncodedEntityStep,
  rotation0,
} from 'ReplicatedStorage/shared/utils/core'
import { findDescendentWithPath } from 'ReplicatedStorage/shared/utils/instance'
import { decodeMeshMidpoint } from 'ReplicatedStorage/shared/utils/mesh'
import {
  AnimatingBreakBlock,
  startBreakBlockAnimation,
} from 'StarterPlayer/StarterPlayerScripts/animations/BreakBlock'
import {
  AnimatingMoveModel,
  createStepModelAnimation,
} from 'StarterPlayer/StarterPlayerScripts/animations/MoveModel'
import { startNewFactoryBlockAnimation } from 'StarterPlayer/StarterPlayerScripts/animations/NewFactoryBlock'
import { PlayerController } from 'StarterPlayer/StarterPlayerScripts/controllers/PlayerController'
import { Events } from 'StarterPlayer/StarterPlayerScripts/network'

export interface Animating {
  model: Model
  elapsed: number
  duration: number
}

export type AnimatingType = AnimatingBreakBlock | AnimatingMoveModel

export interface AnimationQueue {
  animating: AnimatingType
  queue: Array<() => AnimatingType | undefined>
}

@Controller({})
export class AnimationController implements OnStart, OnTick {
  active: Record<string, AnimationQueue> = {}

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
    Events.animateBlock.connect((animation, plotId, voxel) => {
      try {
        this.handleAnimateBlock(animation, plotId, voxel)
      } catch (e) {
        this.logger.Error(`AnimationController.animateBlock: ${e}`)
      }
    })
    Events.animateNewItem.connect(
      (userId, itemType, encodedMidpoint, encodedEntityStep) => {
        try {
          this.handleAnimateNewItem(
            userId,
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
    Events.animateRemoveItems.connect((entities) => {
      for (const entity of entities) {
        try {
          this.handleAnimateRemoveItem(entity)
        } catch (e) {
          this.logger.Error(`AnimationController.handleAnimateRemoveItem: ${e}`)
        }
      }
    })
  }

  onTick(dt: number) {
    for (const [name, animation] of Object.entries(this.active)) {
      const { animating, queue } = animation
      animating.elapsed += dt
      // XXX how to improve type safety?
      animating.onTick(animating as never)
      if (animating.elapsed >= animating.duration) {
        let nextAnimating
        do {
          nextAnimating = queue.shift()?.()
        } while (!nextAnimating && queue.size() > 0)
        if (nextAnimating) animation.animating = nextAnimating
        else delete this.active[name]
      }
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
        this.enqueueAnimation(path.join('.'), () =>
          startBreakBlockAnimation(model),
        )
        break
      case ANIMATIONS.NewFactoryBlock:
        this.enqueueAnimation(path.join('.'), () =>
          startNewFactoryBlockAnimation(model),
        )
    }
  }

  handleAnimateBlock(_animation: string, plotId: string, _voxel: Vector3) {
    const plot = this.playerController.getPlayerSpaceWithId(plotId)
    if (!plot) {
      this.logger.Warn(`handleAnimateBlock: Plot ${plotId} not found`)
      return
    }
  }

  handleAnimateNewItem(
    userId: number,
    itemType: number,
    encodedMidpoint: string,
    encodedEntityStep: EncodedEntityStep,
  ) {
    const item = BLOCK_ID_LOOKUP[itemType]
    if (!item) {
      this.logger.Warn(`handleAnimateNewItem: Item ${itemType} not found`)
      return
    }
    const playerSpace = this.playerController.getPlayerSpaceWithId(userId)
    if (!playerSpace) {
      this.logger.Warn(`handleAnimateNewItem: Player ${userId} space not found`)
      return
    }
    const { entity } = decodeEntityStep(encodedEntityStep)
    const model = cloneBlock(
      item,
      decodeMeshMidpoint(encodedMidpoint),
      new Vector3(1, 1, 1),
      rotation0,
      playerSpace.Plot.Baseplate,
      { ignoreExisting: true, offset: new Vector3(0, 1 / 3, 0) },
    )
    if (!model) return
    model.Name = `Item${entity}`
    model.ScaleTo(1 / 3)
    model.Parent = Workspace.Animating.Items
    this.handleAnimateMoveItems([encodedEntityStep])
  }

  handleAnimateMoveItems(encodedEntityStep: EncodedEntityStep[]) {
    const baseplate = this.playerController.getPlayerSpace().Plot.Baseplate
    for (const entityStep of encodedEntityStep) {
      const { entity, step } = decodeEntityStep(entityStep)
      const name = `Item${entity}`
      const model = Workspace.Animating.Items.FindFirstChild<Model>(name)
      if (!model) {
        this.logger.Warn(`handleAnimateMoveItems ${name} unknown`)
        continue
      }
      this.enqueueAnimation(
        name,
        createStepModelAnimation(model, baseplate, step),
      )
    }
  }

  handleAnimateRemoveItem(entity: number) {
    const name = `Item${entity}`
    const removeAnimation = () => {
      const item = Workspace.Animating.Items.FindFirstChild(name)
      if (!item) this.logger.Warn(`handleAnimateRemoveItem ${name} unknown`)
      item?.Destroy()
      return undefined
    }
    const animating = this.active[name]
    if (animating) {
      animating.queue.push(removeAnimation)
    } else {
      removeAnimation()
    }
  }

  enqueueAnimation(name: string, animation: () => AnimatingType | undefined) {
    const animating = this.active[name]
    if (animating) {
      animating.queue.push(animation)
    } else {
      const animating = animation()
      if (!animating) return
      this.active[name] = {
        animating,
        queue: [],
      }
    }
  }
}
