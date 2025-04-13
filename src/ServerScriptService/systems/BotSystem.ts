import { OnStart, Service } from '@flamework/core'
import { BehaviorTree3, BehaviorTreeCreator } from '@rbxts/behavior-tree-5'
import { Entity } from '@rbxts/jecs'
import { Logger } from '@rbxts/log'
import { Phase } from '@rbxts/planck'
import { ReplicatedStorage } from '@rbxts/services'
import { BotTag } from 'ReplicatedStorage/shared/constants/tags'
import {
  bindTaggedModelToComponent,
  EntityComponentSystem,
  world,
} from 'ReplicatedStorage/shared/services/EntityComponentSystem'
import {
  BehaviorObject,
  runBehaviorTree,
} from 'ReplicatedStorage/shared/utils/behavior'
import { MeshService } from 'ServerScriptService/services/MeshService'
import { store } from 'ServerScriptService/store'

export type BotName = 'CircuitBreaker' | 'CyberClaw' | 'ImperialGunner'

export interface SpawnWave {
  modifier?: string
  phase: Array<{
    begin: number
    duration: number
    spawn: Record<BotName, number>
  }>
}

export const Bot = world.component<undefined>()
export const Behavior = world.component<BehaviorObject>()

@Service()
export class BotSystem implements OnStart {
  behaviorTree!: BehaviorTree3<BehaviorObject>
  entity: Record<string, Entity<unknown>> = {}
  debug = false

  constructor(
    protected readonly ecs: EntityComponentSystem,
    protected readonly meshService: MeshService,
    protected readonly logger: Logger,
  ) {}

  onStart() {
    const behaviorTree = BehaviorTreeCreator.Create<BehaviorObject>(
      ReplicatedStorage.BehaviorTrees.Bot,
    )
    if (!behaviorTree) throw `BehaviorTree not found`
    this.behaviorTree = behaviorTree

    this.ecs.addSystem(
      (_world) => {
        // Bind Models in Workspace to Bot ECS
        bindTaggedModelToComponent(
          BotTag,
          Bot,
          // Create an entity for a tagged model
          (entity, model) => {
            if (this.debug)
              this.logger.Debug(`Bot created: ${model.GetFullName()}`)
            this.entity[model.Name] = entity
            world.set(entity, Behavior, {
              Blackboard: {},
              treeRunning: false,
            })
          },
          // Remove the entity when the model is destroyed
          (entity, model) => {
            if (this.debug)
              this.logger.Debug(`Bot destroyed: ${model.GetFullName()}`)

            delete this.entity[model.Name]
          },
        )
      },
      { phase: Phase.Startup },
    )

    this.ecs.addSystem((_world) => {
      const state = store.getState()
      // spawn bots
      // flock

      // run behavior trees
      for (const [botEntity] of world.query(Bot, Behavior)) {
        const behaviorObject = world.get(botEntity, Behavior)
        if (!behaviorObject) continue
        runBehaviorTree(this.behaviorTree, behaviorObject, state)
      }
    })
  }
}
