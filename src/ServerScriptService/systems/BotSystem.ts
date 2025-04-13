import { OnStart, Service } from '@flamework/core'
import { Logger } from '@rbxts/log'
import { EntityComponentSystem } from 'ReplicatedStorage/shared/services/EntityComponentSystem'
import { MeshService } from 'ServerScriptService/services/MeshService'

export type BotName = 'BotName'

export interface SpawnWave {
  modifier?: string
  phase: Array<{
    begin: number
    duration: number
    spawn: Record<BotName, number>
  }>
}

@Service()
export class BotSystem implements OnStart {
  debug = false

  constructor(
    protected readonly ecs: EntityComponentSystem,
    protected readonly meshService: MeshService,
    protected readonly logger: Logger,
  ) {}

  onStart() {
    this.ecs.addSystem((_world) => {
      // spawn bots
      // flock
      // run behaviore trees
    })
  }
}
