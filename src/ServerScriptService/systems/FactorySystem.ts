import { OnStart, Service } from '@flamework/core'
import { Entity, pair, Tag } from '@rbxts/jecs'
import { Logger } from '@rbxts/log'
import Object from '@rbxts/object-utils'
import Phase from '@rbxts/planck/out/Phase'
import {
  BLOCK_ATTRIBUTE,
  INVENTORY,
  INVENTORY_ID,
  InventoryItemDescription,
} from 'ReplicatedStorage/shared/constants/core'
import { FactoryTag } from 'ReplicatedStorage/shared/constants/tags'
import {
  bindTaggedModelToComponent,
  EntityComponentSystem,
  Model,
  PlayerEntity,
  UserId,
  world,
} from 'ReplicatedStorage/shared/services/EntityComponentSystem'
import { selectPlayerContainer } from 'ReplicatedStorage/shared/state'
import { findPlacedBlockFromDescendent } from 'ReplicatedStorage/shared/utils/block'
import {
  decodeOffsetStep,
  EncodedOffsetStep,
  encodeEntityStep,
  encodeOffsetStep,
  getItemFromBlock,
  getItemInputOffsetStep,
  getItemInputToOffsets,
  getItemOutputOffsetStep,
  getRotationName,
  rotation0,
} from 'ReplicatedStorage/shared/utils/core'
import { findDescendentsWhichAre } from 'ReplicatedStorage/shared/utils/instance'
import {
  decodeMeshMidpoint,
  encodeMeshMidpoint,
  getMeshOffsetsFromMeshMidpoint,
  getMeshRotationFromCFrame,
  meshMapGet,
  meshOffsetMapGet,
} from 'ReplicatedStorage/shared/utils/mesh'
import { Events } from 'ServerScriptService/network'
import { MeshService } from 'ServerScriptService/services/MeshService'
import { store } from 'ServerScriptService/store'

export const Factory = world.component<undefined>()
export const Product = world.component<number>()
export const Container = world.component<undefined>()
export const Linear = world.component<undefined>()
export const OutputOf = world.component<EncodedOffsetStep>()
export const StorageOf = world.component<undefined>()

export const entityOutputs = (parent: Entity) =>
  world.each(pair(OutputOf, parent))

export const entityStores = (factoryEntity: Entity) =>
  world.each(pair(StorageOf, factoryEntity))

export function isEmpty(factoryEntity: Entity) {
  for (const _product of entityStores(factoryEntity)) {
    return false
  }
  return true
}

export function isFull(factoryEntity: Entity) {
  return !isEmpty(factoryEntity)
}

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
        let state = store.getState()

        // Containers output items
        for (const [containerEntity] of world.query(
          Container,
          Model,
          PlayerEntity,
        )) {
          const playerEntity = world.get(containerEntity, PlayerEntity)
          if (!playerEntity) continue
          const userId = world.get(playerEntity, UserId)
          if (!userId) continue
          const container = world.get(containerEntity, Model)
          if (!container) continue
          const containerSelector = selectPlayerContainer(
            userId,
            container.Name,
          )

          // Handle Container output items
          for (const outputEntity of entityOutputs(containerEntity)) {
            if (isFull(outputEntity)) continue

            // Find next item to remove from container
            const productNames = Object.keys(containerSelector(state) ?? {})
            if (productNames.size() === 0) continue
            const productName = productNames[0]

            // Remove item from container
            const oldState = state
            state = store.updatePlayerContainer(
              userId,
              container.Name,
              productName,
              -1,
            )
            if (state === oldState) continue
            /// XXX fix chained containers

            // Add item to conveyor
            const blockId = INVENTORY[productName].blockId
            const productEntity = world.entity()
            world.set(productEntity, Product, blockId)
            world.add(productEntity, pair(StorageOf, outputEntity))

            // Broadcast item to client
            const { offset, step } = decodeOffsetStep(
              world.get(outputEntity, pair(OutputOf, containerEntity)) ?? 0,
            )
            Events.animateNewItem.broadcast(
              blockId,
              encodeMeshMidpoint(
                decodeMeshMidpoint(container.Name).add(offset),
              ),
              encodeEntityStep(productEntity, step),
            )
            this.logger.Info(
              `Factory ${userId} container ${container.Name} output ${productName}:${productEntity}`,
            )
          }
        }

        // Conveyors move items
        const encodedEntitySteps: number[] = []
        for (const [factoryEntity] of world
          .query(Factory, Model)
          .without(Container)) {
          if (isEmpty(factoryEntity)) continue

          // Handle Conveyor output items
          for (const outputEntity of entityOutputs(factoryEntity)) {
            if (isFull(outputEntity)) continue

            const storageOfFactoryEntity = pair(StorageOf, factoryEntity)
            for (const productEntity of world.each(storageOfFactoryEntity)) {
              // Remove item from conveyor
              world.remove(productEntity, storageOfFactoryEntity)
              const blockId = world.get(productEntity, Product)
              if (!blockId) continue
              const productName = INVENTORY_ID[blockId].name

              if (world.has(outputEntity, Container)) {
                const container = world.get(outputEntity, Model)
                if (!container) continue
                const player = world.get(outputEntity, PlayerEntity)
                if (!player) continue
                const userId = world.get(player, UserId)
                if (!userId) continue

                // Add item to container
                state = store.updatePlayerContainer(
                  userId,
                  container.Name,
                  productName,
                  1,
                )
                Events.animateRemoveItem.broadcast(productEntity)
                this.logger.Info(
                  `Factory ${userId} container ${container.Name} input ${productName}:${productEntity}`,
                )
              } else {
                // Add item to next conveyor
                world.add(productEntity, pair(StorageOf, outputEntity))

                // Broadcast item movement to client
                const { step } = decodeOffsetStep(
                  world.get(outputEntity, pair(OutputOf, factoryEntity)) ?? 0,
                )
                encodedEntitySteps.push(encodeEntityStep(productEntity, step))
                this.logger.Info(
                  `Factory conveyor moved ${productName}:${productEntity} from ${factoryEntity} -> ${outputEntity}`,
                )
              }
              break
            }
          }
        }
        if (encodedEntitySteps.size() > 0) {
          Events.animateMoveItems.broadcast(encodedEntitySteps)
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

    world.set(entity, PlayerEntity, playerEntity)

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

    const plot = playerSandbox.plot[playerSandbox.location]
    const midpoint = decodeMeshMidpoint(model.Name)
    const rotation = getMeshRotationFromCFrame(
      model.GetPivot(),
      playerSandbox.workspace.Plot.Baseplate,
    )
    const rotationName = getRotationName(rotation)
    this.logger.Info(
      `Factory ${userId} created ${item.name}:${entity}: ${model.GetFullName()} (${midpoint}) ${rotationName}`,
    )

    // Connect new equipiment to existing equipment
    getMeshOffsetsFromMeshMidpoint(
      midpoint,
      rotation,
      item.outputTo ?? [],
    ).forEach((outputTo, outputToIndex) => {
      for (const inputTo of meshOffsetMapGet(plot.inputTo, outputTo)) {
        // XXX add entity to MeshService to support off-world factories
        const outputEntity =
          playerSandbox.workspace.PlacedBlocks.FindFirstChild(
            inputTo,
          )?.GetAttribute(BLOCK_ATTRIBUTE.EntityId) as
            | Entity<undefined>
            | undefined
        if (!outputEntity) continue

        const { offset, step } = getItemOutputOffsetStep(
          item,
          rotation,
          outputToIndex,
        )
        world.set(
          outputEntity,
          pair(OutputOf, entity),
          encodeOffsetStep(offset, step),
        )
        this.logger.Info(
          `Factory ${userId} connected: (${midpoint}) -> (${decodeMeshMidpoint(inputTo)})`,
        )
      }
    })

    // Connect existing equipment to new equipment
    getMeshOffsetsFromMeshMidpoint(
      midpoint,
      rotation,
      getItemInputToOffsets(item) ?? [],
    ).forEach((inputTo, inputToIndex) => {
      for (const outputTo of meshOffsetMapGet(plot.outputTo, inputTo)) {
        // XXX add entity to MeshService to support off-world factories
        const inputModel =
          playerSandbox.workspace.PlacedBlocks.FindFirstChild(outputTo)
        const inputEntity = inputModel?.GetAttribute(
          BLOCK_ATTRIBUTE.EntityId,
        ) as Entity<undefined> | undefined
        if (!inputEntity) continue

        const inputMeshData = meshMapGet(
          plot.mesh,
          decodeMeshMidpoint(outputTo),
        )
        const { offset, step } = getItemInputOffsetStep(
          item,
          inputMeshData?.rotation ?? rotation0,
          inputToIndex,
        )
        world.set(
          entity,
          pair(OutputOf, inputEntity),
          encodeOffsetStep(offset, step),
        )
        this.logger.Info(
          `Factory ${userId} connected: (${decodeMeshMidpoint(outputTo)}) -> (${midpoint})`,
        )
      }
    })

    // Synchronize conveyor animations - XXX move to client
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
