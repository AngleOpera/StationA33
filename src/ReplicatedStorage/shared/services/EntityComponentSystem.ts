import { Controller, OnStart, OnTick, Service } from '@flamework/core'
import { Entity, OnRemove, OnSet, Tag, World } from '@rbxts/jecs'
import { Logger } from '@rbxts/log'
import { timePassed } from '@rbxts/planck/out/conditions'
import Phase from '@rbxts/planck/out/Phase'
import Scheduler from '@rbxts/planck/out/Scheduler'
import { CollectionService } from '@rbxts/services'
import { ENTITY_ATTRIBUTE } from 'ReplicatedStorage/shared/constants/core'

export const world = new World()
export const Name = world.component<string>()
export const Model = world.component<Model>()
export const Owner = world.component<number>()

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
        if (model?.Parent) {
          try {
            model.Destroy()
            this.logger.Info(`Destroyed model ${model.GetFullName()}`)
          } catch {
            // ignore
          }
        }
      })
    }, Phase.Startup)
  }

  onTick() {
    this.scheduler.runAll()
  }

  addSystem(
    system: (world: World) => void,
    options?: { phase?: Phase; timePassedCondition?: number },
  ) {
    this.scheduler.addSystem(system, options?.phase)
    if (options?.timePassedCondition)
      this.scheduler.addRunCondition(
        system,
        timePassed(options.timePassedCondition),
      )
  }
}

export function bindTaggedModelToComponent(
  tag: string,
  component: Entity<undefined>,
  joinFunc?: (entity: Tag, model: Model) => void,
  leaveFunc?: (entity: Tag, model: Model) => void,
) {
  forEveryTag(
    tag,
    (instance) => {
      if (!instance.IsA('Model')) return
      const entity = world.entity()
      world.set(entity, Model, instance)
      world.add(entity, component)
      joinFunc?.(entity, instance)
    },
    (instance) => {
      if (!instance.IsA('Model')) return
      const entity = instance.GetAttribute(ENTITY_ATTRIBUTE.EntityId) as
        | Entity<undefined>
        | undefined
      if (!entity) return
      if (world.get(entity, Model) === instance) {
        leaveFunc?.(entity, instance)
        world.delete(entity)
      }
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
