import { OnStart, Service } from '@flamework/core'
import { Tag } from '@rbxts/jecs'
import { Logger } from '@rbxts/log'
import Phase from '@rbxts/planck/out/Phase'
import { Workspace } from '@rbxts/services'
import { InventoryItemDescription } from 'ReplicatedStorage/shared/constants/core'
import { FactoryTag } from 'ReplicatedStorage/shared/constants/tags'
import {
  bindTaggedModelToComponent,
  EntityComponentSystem,
  Model,
  world,
} from 'ReplicatedStorage/shared/services/EntityComponentSystem'
import { getItemFromBlock } from 'ReplicatedStorage/shared/utils/core'
import {
  findDescendentsWhichAre,
  findPathToDescendent,
} from 'ReplicatedStorage/shared/utils/instance'
import {
  decodeMeshMidpoint,
  getMeshRotationFromCFrame,
} from 'ReplicatedStorage/shared/utils/mesh'
import { MeshService } from 'ServerScriptService/services/MeshService'

export const Factory = world.component<undefined>()

@Service()
export class FactorySystem implements OnStart {
  constructor(
    protected readonly ecs: EntityComponentSystem,
    protected readonly meshService: MeshService,
    protected readonly logger: Logger,
  ) {}

  onStart() {
    this.ecs.addSystem(
      (_world) => {
        bindTaggedModelToComponent(
          FactoryTag,
          Factory,
          (entity, model) => {
            const path = findPathToDescendent(Workspace.PlayerSpaces, model)
            if (!path || path.size() < 3 || path[1] !== 'PlacedBlocks') return
            const userId = tonumber(path[0])
            const item = getItemFromBlock(model)
            if (!userId || !item) return
            const playerEntity = this.ecs.players[userId]
            if (!playerEntity) return
            this.handleNewFactoryEquipment(
              userId,
              playerEntity,
              entity,
              model,
              item,
            )
          },
          (_entity, model) => {
            this.logger.Info(`Factory destroyed: ${model.GetFullName()}`)
          },
        )
      },
      { phase: Phase.Startup },
    )
  }

  handleNewFactoryEquipment(
    userId: number,
    playerEntity: Tag,
    entity: Tag,
    model: Model,
    item: InventoryItemDescription,
  ) {
    world.add(entity, playerEntity)
    for (const [e] of world.query(playerEntity, Model)) {
      const model = world.get(e, Model)
      if (!model) continue
      for (const beam of findDescendentsWhichAre<Beam>(model, 'Beam')) {
        beam.SetTextureOffset(0)
        print('set texture offset', beam.Name, model.Name)
      }
    }
    const playerSandbox = this.meshService.getUserIdSandbox(userId)
    if (!playerSandbox) return

    const midpoint = decodeMeshMidpoint(model.Name)
    const rotation = getMeshRotationFromCFrame(
      model.GetPivot(),
      playerSandbox.workspace.Plot.Baseplate,
    )
    this.logger.Info(
      `Factory ${userId} created: ${model.GetFullName()} ${midpoint} ${rotation} ${item.description}`,
    )
  }
}
