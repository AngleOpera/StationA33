import { Controller, OnStart, OnTick, Service } from '@flamework/core'
import { pair, Wildcard, World } from '@rbxts/jecs'
import { Logger } from '@rbxts/log'
import Phase from '@rbxts/planck/out/Phase'
import Scheduler from '@rbxts/planck/out/Scheduler'
import { CollectionService } from '@rbxts/services'

export const world = new World()
export const Name = world.component()
export const Eats = world.component()
export const Apples = world.component()
export const Oranges = world.component()

@Controller()
@Service()
export class SchedulerService implements OnStart, OnTick {
  scheduler: Scheduler<World[]>

  constructor(protected readonly logger: Logger) {
    this.scheduler = new Scheduler(world)
  }

  onStart() {
    this.scheduler.addSystems([systemA], Phase.Startup)
    this.scheduler.addSystems([systemB])
  }

  onTick() {
    this.scheduler.runAll()
  }
}

export function forEveryTag<T extends Instance>(
  world: World,
  tag: string,
  callback: (world: World, instance: T, removed?: boolean) => void,
) {
  for (const instance of CollectionService.GetTagged(tag))
    callback(world, instance as T)

  CollectionService.GetInstanceRemovedSignal(tag).Connect((instance) =>
    callback(world, instance as T, true),
  )

  CollectionService.GetInstanceAddedSignal(tag).Connect((instance) =>
    callback(world, instance as T),
  )
}

function systemA(world: World) {
  print('systemA running')
  world.set(Apples, Name, 'apples')
  world.set(Oranges, Name, 'oranges')

  const bob = world.entity()
  world.set(bob, pair(Eats, Apples), 10)
  world.set(bob, pair(Eats, Oranges), 5)
  world.set(bob, Name, 'bob')

  const alice = world.entity()
  world.set(alice, pair(Eats, Apples), 4)
  world.set(alice, Name, 'alice')
}

function systemB(world: World) {
  for (const [id, amount] of world.query(pair(Eats, Wildcard))) {
    const food = world.target(id, Eats)
    const foodName = food ? world.get(food, Name) : ''
    const entityName = world.get(id, Name)
    print(`${entityName} eats ${amount} ${foodName}`)
  }
}
