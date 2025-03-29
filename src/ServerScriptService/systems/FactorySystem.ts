import { OnStart, Service } from '@flamework/core'
import { ChildOf, Entity, pair, Tag } from '@rbxts/jecs'
import { Logger } from '@rbxts/log'
import Phase from '@rbxts/planck/out/Phase'
import {
  ENTITY_ATTRIBUTE,
  INVENTORY,
  InventoryItemDescription,
} from 'ReplicatedStorage/shared/constants/core'
import { FactoryTag } from 'ReplicatedStorage/shared/constants/tags'
import {
  bindTaggedModelToComponent,
  EntityComponentSystem,
  Model,
  world,
} from 'ReplicatedStorage/shared/services/EntityComponentSystem'
import {
  findPlacedBlockFromDescendent,
  getItemFromBlock,
  getItemInputToOffsets,
  getItemVector3,
} from 'ReplicatedStorage/shared/utils/core'
import { findDescendentsWhichAre } from 'ReplicatedStorage/shared/utils/instance'
import {
  decodeMeshMidpoint,
  getMeshOffsetsFromMeshMidpoint,
  getMeshRotationFromCFrame,
  getMeshRotationName,
  meshOffsetMapGet,
} from 'ReplicatedStorage/shared/utils/mesh'
import { MeshService } from 'ServerScriptService/services/MeshService'

export const Factory = world.component<undefined>()
export const Product = world.component<undefined>()
export const Container = world.component<undefined>()
export const Linear = world.component<undefined>()

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
            const { userId } = findPlacedBlockFromDescendent(model)
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
    this.ecs.addSystem(
      (_world) => {
        // Containers output items
        for (const [e] of world.query(Container, Model)) {
          const model = world.get(e, Model)
          if (!model) continue
          const item = getItemFromBlock(model)
          if (!item) continue

          for (const child of world.children(e)) {
            if (world.has(child, Product)) {
              world.delete(child)
            }
          }
        }

        // Conveyors move items
        for (const [e] of world.query(Factory, Model).without(Container)) {
          const model = world.get(e, Model)
          if (!model) continue
          const item = getItemFromBlock(model)
          if (!item) continue
        }
      },
      { timePassedCondition: 0.1 },
    )
  }

  handleNewFactoryEquipment(
    userId: number,
    playerEntity: Tag,
    entity: Tag,
    model: Model,
    item: InventoryItemDescription,
  ) {
    const playerSandbox = this.meshService.getUserIdSandbox(userId)
    if (!playerSandbox) return

    world.add(entity, playerEntity)

    switch (item.blockId) {
      case INVENTORY.Container.blockId:
        world.add(entity, Container)
        break

      case INVENTORY.Conveyor.blockId:
      case INVENTORY.LeftConveyor.blockId:
      case INVENTORY.RightConveyor.blockId:
        world.add(entity, Linear)
        break
    }

    const midpoint = decodeMeshMidpoint(model.Name)
    const unrotatedSize = getItemVector3(item.size)
    const rotation = getMeshRotationFromCFrame(
      model.GetPivot(),
      playerSandbox.workspace.Plot.Baseplate,
    )
    const rotationName = getMeshRotationName(rotation)
    this.logger.Info(
      `Factory ${userId} created: ${model.GetFullName()} (${midpoint}) ${rotationName}`,
    )

    const plot = playerSandbox.plot[playerSandbox.location]
    for (const outputTo of getMeshOffsetsFromMeshMidpoint(
      midpoint,
      unrotatedSize,
      rotation,
      item.outputTo ?? [],
    )) {
      for (const inputTo of meshOffsetMapGet(plot.inputTo, outputTo)) {
        // XXX add entity to MeshService to support off-world factories
        const outputEntity =
          playerSandbox.workspace.PlacedBlocks.FindFirstChild(
            inputTo,
          )?.GetAttribute(ENTITY_ATTRIBUTE.EntityId) as
            | Entity<undefined>
            | undefined
        if (!outputEntity) continue

        world.add(outputEntity, pair(ChildOf, entity))
        this.logger.Info(
          `Factory ${userId} connected: (${midpoint}) -> (${decodeMeshMidpoint(inputTo)})`,
        )
      }
    }

    for (const inputTo of getMeshOffsetsFromMeshMidpoint(
      midpoint,
      unrotatedSize,
      rotation,
      getItemInputToOffsets(item) ?? [],
    )) {
      for (const outputTo of meshOffsetMapGet(plot.outputTo, inputTo)) {
        // XXX add entity to MeshService to support off-world factories
        const inputEntity = playerSandbox.workspace.PlacedBlocks.FindFirstChild(
          outputTo,
        )?.GetAttribute(ENTITY_ATTRIBUTE.EntityId) as
          | Entity<undefined>
          | undefined
        if (!inputEntity) continue

        world.add(entity, pair(ChildOf, inputEntity))
        this.logger.Info(
          `Factory ${userId} connected: (${decodeMeshMidpoint(outputTo)}) -> (${midpoint})`,
        )
      }
    }

    // Synchronize conveyor animations
    for (const [e] of world.query(playerEntity, Model)) {
      const model = world.get(e, Model)
      if (!model) continue
      for (const beam of findDescendentsWhichAre<Beam>(model, 'Beam')) {
        beam.SetTextureOffset(0)
        // print('set texture offset', beam.Name, model.Name)
      }
    }
  }
}
