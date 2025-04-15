import { OnStart, Service } from '@flamework/core'
import { randomElement } from '@rbxts/array-utils'
import { BehaviorTree3, BehaviorTreeCreator } from '@rbxts/behavior-tree-5'
import { Entity } from '@rbxts/jecs'
import { Logger } from '@rbxts/log'
import Object from '@rbxts/object-utils'
import { Phase } from '@rbxts/planck'
import { ReplicatedStorage, Workspace } from '@rbxts/services'
import { BotTag, WaveSpawnerTag } from 'ReplicatedStorage/shared/constants/tags'
import {
  bindTaggedModelToComponent,
  EntityComponentSystem,
  world,
} from 'ReplicatedStorage/shared/services/EntityComponentSystem'
import {
  BehaviorObject,
  runBehaviorTree,
} from 'ReplicatedStorage/shared/utils/behavior'
import { forEveryTag } from 'ReplicatedStorage/shared/utils/instance'
import { getRandomLocation } from 'ReplicatedStorage/shared/utils/part'
import { MeshService } from 'ServerScriptService/services/MeshService'
import { store } from 'ServerScriptService/store'

export interface SpawnWave {
  modifier?: string
  phase: Array<{
    duration: number
    spawn: Partial<Record<BotName, number>>
  }>
}

export const Bot = world.component<undefined>()
export const Behavior = world.component<BehaviorObject>()

export const schedules: Record<string, SpawnWave[]> = {
  Easy: [
    {
      phase: [
        {
          duration: 1,
          spawn: {
            AlienBioHazard: 1,
            CircuitBreaker: 1,
            CombatRobot: 1,
            CubeForce: 1,
            CyberClaw: 1,
            ImperialGunner: 1,
            SecurityRobot: 1,
          },
        },
      ],
    },
  ],
}

@Service()
export class BotSystem implements OnStart {
  behaviorTree!: BehaviorTree3<BehaviorObject>
  entity: Record<string, Entity<unknown>> = {}
  phaseSpawned: Partial<Record<BotName, number>> = {}
  phaseStarted = DateTime.now().UnixTimestamp
  phaseIndex = 0
  scheduleIndex = 0
  schedule = schedules.Easy
  spawners: BasePart[] = []
  debug = true

  constructor(
    protected readonly ecs: EntityComponentSystem,
    protected readonly meshService: MeshService,
    protected readonly logger: Logger,
  ) {}

  onStart() {
    // Load behavior trees
    const behaviorTree = BehaviorTreeCreator.Create<BehaviorObject>(
      ReplicatedStorage.BehaviorTrees.Bot,
    )
    if (!behaviorTree) throw `BehaviorTree not found`
    this.behaviorTree = behaviorTree

    // Track spawners
    forEveryTag(
      WaveSpawnerTag,
      (spawner) => {
        if (spawner.IsA('BasePart')) this.spawners.push(spawner)
      },
      (spawner) => this.spawners.filter((x) => x !== spawner),
    )

    // Bind Models in Workspace to Bot ECS
    this.ecs.addSystem(
      (_world) => {
        bindTaggedModelToComponent(
          BotTag,
          Bot,
          // Create an entity for a tagged model
          (entity, model) => {
            if (this.debug)
              this.logger.Debug(`Bot created: ${model.GetFullName()}`)
            this.entity[model.Name] = entity
            world.set(entity, Behavior, {
              Blackboard: {
                sourceInstance: model,
                sourceHumanoid: model.WaitForChild<Humanoid>('Humanoid'),
              },
              treeRunning: false,
            })
          },
          // Remove the entity when the model is destroyed
          (_entity, model) => {
            if (this.debug)
              this.logger.Debug(`Bot destroyed: ${model.GetFullName()}`)

            delete this.entity[model.Name]
          },
        )
      },
      { phase: Phase.Startup },
    )

    // Spawn waves of bots
    this.ecs.addSystem(
      (_world) => {
        if (this.scheduleIndex >= this.schedule.size()) return
        const now = DateTime.now().UnixTimestamp
        const schedule = this.schedule[this.scheduleIndex]
        const phase = schedule.phase[this.phaseIndex]
        const phaseCompleted = math.min(
          1,
          (now - this.phaseStarted) / phase.duration,
        )
        for (const [botName, botCount] of Object.entries(phase.spawn)) {
          const target = math.floor(botCount * phaseCompleted)
          let spawned = this.phaseSpawned[botName] ?? 0
          for (; spawned < target; spawned++) {
            const spawner = randomElement(this.spawners)
            const bot = ReplicatedStorage.Bots[botName].Clone()
            bot.Parent = Workspace.Bots
            bot.PivotTo(
              getRandomLocation(spawner, bot.GetBoundingBox()[1].Y / 2),
            )
            if (this.debug) this.logger.Debug(`Spawning ${botName}`)
          }
          this.phaseSpawned[botName] = spawned
        }

        if (phaseCompleted < 1) return
        this.phaseStarted = DateTime.now().UnixTimestamp
        this.phaseSpawned = {}
        this.phaseIndex++
        if (this.phaseIndex >= schedule.phase.size()) {
          this.scheduleIndex++
          this.phaseIndex = 0
        }
      },
      { timePassedCondition: 1 },
    )

    this.ecs.addSystem((_world) => {
      // flock
    })

    // Run behavior trees
    this.ecs.addSystem((_world) => {
      const state = store.getState()
      for (const [botEntity] of world.query(Bot, Behavior)) {
        const behaviorObject = world.get(botEntity, Behavior)
        if (!behaviorObject) continue
        runBehaviorTree(this.behaviorTree, behaviorObject, state)
      }
    })
  }
}
