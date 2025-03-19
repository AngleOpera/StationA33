import { Controller, OnStart, OnTick, Service } from '@flamework/core'
import { Entity, OnRemove, OnSet, World } from '@rbxts/jecs'
import { Logger } from '@rbxts/log'
import { timePassed } from '@rbxts/planck/out/conditions'
import Phase from '@rbxts/planck/out/Phase'
import Scheduler from '@rbxts/planck/out/Scheduler'
import { CollectionService } from '@rbxts/services'
import { ENTITY_ATTRIBUTE } from 'ReplicatedStorage/shared/constants/core'
import { SpawnerTag } from 'ReplicatedStorage/shared/constants/tags'

export const world = new World()
export const Name = world.component<string>()
export const Model = world.component<Model>()
export const Spawner = world.component<undefined>()

@Controller()
@Service()
export class EntityComponentSystem implements OnStart, OnTick {
  scheduler: Scheduler<World[]>

  constructor(protected readonly logger: Logger) {
    this.scheduler = new Scheduler(world)
  }

  onStart() {
    this.scheduler.addSystem((world) => {
      world.set(Model, OnSet, (entity, value) => {
        const model = value as Instance
        model.SetAttribute(ENTITY_ATTRIBUTE.EntityId, entity)
      })

      world.set(Model, OnRemove, (entity) => {
        const model = world.get(entity, Model)
        if (model) {
          this.logger.Info(`Destroying model ${model.GetFullName()}`)
          model.Destroy()
        }
      })

      bindTaggedModelToComponent(SpawnerTag, Spawner)
    }, Phase.Startup)

    this.scheduler.addSystem(spawnerSystem)
    this.scheduler.addRunCondition(spawnerSystem, timePassed(1))
  }

  onTick() {
    this.scheduler.runAll()
  }
}

export function spawnerSystem(world: World) {
  for (const [entity] of world.query(Spawner, Model)) {
    const model = world.get(entity, Model)
    print(model)
  }
}

export function bindTaggedModelToComponent(
  tag: string,
  component: Entity<undefined>,
) {
  forEveryTag(
    tag,
    (instance) => {
      if (!instance.IsA('Model')) return
      const entity = world.entity()
      world.set(entity, Model, instance)
      world.add(entity, component)
    },
    (instance) => {
      if (!instance.IsA('Model')) return
      const entity = instance.GetAttribute(ENTITY_ATTRIBUTE.EntityId) as
        | Entity<unknown>
        | undefined
      if (!entity) return
      if (world.get(entity, Model) === instance) {
        world.delete(entity)
      }
      /* for (const [entity] of world.query(Model)) {
        if (world.get(entity, Model) === instance) {
          world.delete(entity)
          break
        }
      } */
    },
  )
}

export function forEveryTag<T extends Instance>(
  tag: string,
  joinFunc: (instance: T) => void,
  leaveFunc: (instance: T) => void,
) {
  for (const instance of CollectionService.GetTagged(tag))
    joinFunc(instance as T)

  CollectionService.GetInstanceRemovedSignal(tag).Connect((instance) =>
    leaveFunc(instance as T),
  )

  CollectionService.GetInstanceAddedSignal(tag).Connect((instance) =>
    joinFunc(instance as T),
  )
}
