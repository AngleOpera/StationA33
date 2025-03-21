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
  world,
} from 'ReplicatedStorage/shared/services/EntityComponentSystem'
import { getItemFromBlock } from 'ReplicatedStorage/shared/utils/core'
import { findPathToDescendent } from 'ReplicatedStorage/shared/utils/instance'

export const Factory = world.component<undefined>()

@Service()
export class FactorySystem implements OnStart {
  constructor(
    protected readonly ecs: EntityComponentSystem,
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
            if (!path || path.size() < 2) return
            const userId = tonumber(path[0])
            const item = getItemFromBlock(model)
            if (!userId || !item) return
            this.handleNewFactoryEquipment(userId, entity, model, item)
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
    _entity: Tag,
    model: Instance,
    item: InventoryItemDescription,
  ) {
    this.logger.Info(
      `Factory ${userId} created: ${model.GetFullName()} ${item.description}`,
    )
  }
}
