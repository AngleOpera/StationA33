import { OnStart, Service } from '@flamework/core'
import { Entity, Name, pair, Tag } from '@rbxts/jecs'
import { Logger } from '@rbxts/log'
import Object from '@rbxts/object-utils'
import Phase from '@rbxts/planck/out/Phase'
import { Workspace } from '@rbxts/services'
import {
  ANIMATIONS,
  BLOCK_ID_LOOKUP,
  INVENTORY,
  INVENTORY_ID,
  InventoryItemDescription,
} from 'ReplicatedStorage/shared/constants/core'
import { FactoryTag } from 'ReplicatedStorage/shared/constants/tags'
import {
  bindTaggedModelToComponent,
  EntityComponentSystem,
  PlayerEntity,
  UserId,
  world,
} from 'ReplicatedStorage/shared/services/EntityComponentSystem'
import { selectPlayerContainer } from 'ReplicatedStorage/shared/state'
import { findPlacedBlockFromDescendent } from 'ReplicatedStorage/shared/utils/block'
import {
  decodeOffsetStep,
  EncodedEntityStep,
  EncodedOffsetStep,
  encodeEntityStep,
  encodeOffsetStep,
  findOffsetIndexFromMidpointAndOffsetPoint,
  getItemFromBlock,
  getItemInputToOffsets,
  getItemOutputOffsetStep,
  getOffsetsFromMidpoint,
  getRotationName,
} from 'ReplicatedStorage/shared/utils/core'
import { findPathToDescendent } from 'ReplicatedStorage/shared/utils/instance'
import {
  decodeMeshMidpoint,
  encodeMeshMidpoint,
  meshMapGet,
  meshMapGetEncoded,
  meshOffsetMapGet,
  MeshPlot,
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

export function outputNewProduct(
  userId: number,
  encodedMidpoint: string,
  entity: Entity<unknown>,
  outputEntity: Entity<unknown>,
  blockId: number,
) {
  // Add item to conveyor
  const productEntity = world.entity()
  world.set(productEntity, Product, blockId)
  world.add(productEntity, pair(StorageOf, outputEntity))

  // Broadcast item to client
  const { offset, step } = decodeOffsetStep(
    world.get(outputEntity, pair(OutputOf, entity)) ?? 0,
  )
  Events.animateNewItem.broadcast(
    userId,
    blockId,
    encodeMeshMidpoint(decodeMeshMidpoint(encodedMidpoint).add(offset)),
    encodeEntityStep(productEntity, step),
  )

  return productEntity
}

export function moveProductToContainer(
  productEntity: Entity<unknown>,
  _inputEntity: Entity<unknown>,
  outputEntity: Entity<unknown>,
) {
  const blockId = world.get(productEntity, Product)
  const player = world.get(outputEntity, PlayerEntity)
  const containerName = world.get(outputEntity, Name)
  if (!blockId || !player || !containerName) return
  const productName = INVENTORY_ID[blockId].name
  const userId = world.get(player, UserId)
  if (!userId) return

  store.updatePlayerContainer(userId, containerName, productName, 1)
  return { userId, containerName, productName }
}

@Service()
export class FactorySystem implements OnStart {
  debug = false

  constructor(
    protected readonly ecs: EntityComponentSystem,
    protected readonly meshService: MeshService,
    protected readonly logger: Logger,
  ) {}

  onStart() {
    this.ecs.addSystem(
      (_world) => {
        // Bind Models in Workspace to Factory ECS
        bindTaggedModelToComponent(
          FactoryTag,
          Factory,
          // Create an entity for a tagged model
          (entity, model) => {
            const { userId } = findPlacedBlockFromDescendent(model)
            const item = getItemFromBlock(model)
            if (!userId || !item) return

            const playerEntity = this.ecs.players[userId]
            const playerSandbox = this.meshService.getUserSandbox(userId)
            if (!playerEntity || !playerSandbox) return

            // Track the entity for factory blocks
            const plot = playerSandbox.plot[playerSandbox.location]
            plot.entity[model.Name] = entity

            this.handleNewFactoryEquipment(
              plot,
              model.Name,
              entity,
              playerEntity,
              item,
              this.debug,
            )

            const path = findPathToDescendent(Workspace, model)
            if (path) Events.animate.broadcast(ANIMATIONS.NewFactoryBlock, path)
          },
          // Remove the entity when the model is destroyed
          (entity, model) => {
            if (this.debug)
              this.logger.Debug(`Factory destroyed: ${model.GetFullName()}`)
            const { userId } = findPlacedBlockFromDescendent(model)

            // Disconnect any connections
            for (const outputEntity of world.each(pair(OutputOf, entity))) {
              world.remove(outputEntity, pair(OutputOf, entity))
            }

            // Give items on conveyor back to player
            const removedEntity: number[] = []
            for (const productEntity of world.each(pair(StorageOf, entity))) {
              const blockId = world.get(productEntity, Product)
              if (userId && blockId)
                store.updatePlayerInventory(
                  userId,
                  BLOCK_ID_LOOKUP[blockId].name,
                  1,
                )
              world.delete(productEntity)
              removedEntity.push(productEntity)
            }
            if (removedEntity.size()) {
              Events.animateRemoveItems.broadcast(removedEntity)
            }

            // Removed named entity mapping
            if (!userId) return
            const playerSandbox = this.meshService.getUserSandbox(userId)
            if (!playerSandbox) return
            const plot = playerSandbox.plot[playerSandbox.location]
            delete plot.entity[model.Name]
          },
        )
      },
      { phase: Phase.Startup },
    )

    this.ecs.addSystem(
      (_world) => {
        const seenProduct: Record<number, boolean> = {}

        // Containers output items
        for (const [containerEntity] of world.query(
          Name,
          Container,
          PlayerEntity,
        )) {
          const playerEntity = world.get(containerEntity, PlayerEntity)
          const containerName = world.get(containerEntity, Name)
          if (!playerEntity || !containerName) continue
          const userId = world.get(playerEntity, UserId)
          if (!userId) continue

          // Handle Container output items
          let state = store.getState()
          const containerSelector = selectPlayerContainer(userId, containerName)
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
              containerName,
              productName,
              -1,
            )
            if (state === oldState) continue

            if (world.has(outputEntity, Container)) {
              // Add item to chained container without creating a product entity
              const outputContainerName = world.get(outputEntity, Name)
              store.updatePlayerContainer(
                userId,
                outputContainerName || containerName,
                productName,
                1,
              )
              if (this.debug)
                this.logger.Debug(
                  `Factory ${userId} container ${outputContainerName} input ${productName}`,
                )
            } else {
              const productEntity = outputNewProduct(
                userId,
                containerName,
                containerEntity,
                outputEntity,
                INVENTORY[productName].blockId,
              )
              seenProduct[productEntity] = true
              if (this.debug)
                this.logger.Debug(
                  `Factory ${userId} container ${containerName} output ${productName}:${productEntity}`,
                )
            }
          }
        }

        // Conveyors move items
        const encodedEntitySteps: EncodedEntityStep[] = []
        const removedEntity: number[] = []
        for (const [factoryEntity] of world
          .query(Name, Factory)
          .without(Container)) {
          if (isEmpty(factoryEntity)) continue

          // Handle Conveyor output items
          for (const outputEntity of entityOutputs(factoryEntity)) {
            if (isFull(outputEntity)) continue

            const storageOfFactoryEntity = pair(StorageOf, factoryEntity)
            for (const productEntity of world.each(storageOfFactoryEntity)) {
              if (seenProduct[productEntity]) continue
              seenProduct[productEntity] = true

              // Remove item from conveyor
              world.remove(productEntity, storageOfFactoryEntity)

              // Broadcast item movement to client
              const { step } = decodeOffsetStep(
                world.get(outputEntity, pair(OutputOf, factoryEntity)) ?? 0,
              )
              encodedEntitySteps.push(encodeEntityStep(productEntity, step))

              if (world.has(outputEntity, Container)) {
                const moved = moveProductToContainer(
                  productEntity,
                  factoryEntity,
                  outputEntity,
                )
                world.delete(productEntity)
                removedEntity.push(productEntity)
                if (this.debug)
                  this.logger.Debug(
                    `Factory container ${factoryEntity} input ${moved?.productName}:${productEntity}`,
                  )
              } else {
                // Add item to next conveyor
                world.add(productEntity, pair(StorageOf, outputEntity))
                if (this.debug)
                  this.logger.Debug(
                    `Factory conveyor moved ${productEntity} from ${factoryEntity} -> ${outputEntity}`,
                  )
              }
              break
            }
          }
        }
        if (encodedEntitySteps.size() > 0) {
          Events.animateMoveItems.broadcast(encodedEntitySteps)
        }
        if (removedEntity.size() > 0) {
          Events.animateRemoveItems.broadcast(removedEntity)
        }
      },
      { timePassedCondition: 0.25 },
    )
  }

  handleNewFactoryEquipment(
    plot: MeshPlot,
    encodedMidpoint: string,
    entity: Tag,
    playerEntity: Tag,
    item: InventoryItemDescription,
    debug: boolean,
  ) {
    const meshData = meshMapGetEncoded(plot.mesh, encodedMidpoint)
    if (!meshData) return

    const { rotation } = meshData
    const rotationName = getRotationName(rotation)
    const midpoint = decodeMeshMidpoint(encodedMidpoint)
    if (debug)
      this.logger.Debug(
        `Factory ${plot.userId} created ${item.name}:${entity}: ${encodedMidpoint} (${midpoint}) ${rotationName}`,
      )

    // Set entity components
    world.set(entity, PlayerEntity, playerEntity)
    world.set(entity, Name, encodedMidpoint)

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

    // Connect new equipiment to existing equipment
    getOffsetsFromMidpoint(midpoint, rotation, item.outputTo ?? []).forEach(
      (outputTo, outputToIndex) => {
        for (const inputTo of meshOffsetMapGet(plot.inputTo, outputTo)) {
          const outputEntity = plot.entity[inputTo]
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
          if (debug)
            this.logger.Debug(
              `Factory ${plot.userId} connected: (${midpoint}) -> (${decodeMeshMidpoint(inputTo)}) offset (${offset}) step ${step})`,
            )
        }
      },
    )

    // Connect existing equipment to new equipment
    getOffsetsFromMidpoint(
      midpoint,
      rotation,
      getItemInputToOffsets(item) ?? [],
    ).forEach((inputTo) => {
      for (const inputEncodedMidpoint of meshOffsetMapGet(
        plot.outputTo,
        inputTo,
      )) {
        const inputMidpoint = decodeMeshMidpoint(inputEncodedMidpoint)
        const inputMesh = meshMapGet(plot.mesh, inputMidpoint)
        if (!inputMesh) continue

        const inputEntity = plot.entity[inputEncodedMidpoint]
        const inputItem = BLOCK_ID_LOOKUP[inputMesh.blockId]
        if (!inputEntity || !inputItem) continue

        const outputToIndex = findOffsetIndexFromMidpointAndOffsetPoint(
          inputItem.outputTo ?? [],
          inputMidpoint,
          inputTo,
          inputMesh.rotation,
        )
        if (outputToIndex < 0) {
          this.logger.Warn(
            `Factory ${plot.userId} failed to find outputTo index: (${inputMidpoint}) -> (${inputTo})`,
          )
          continue
        }

        const { offset, step } = getItemOutputOffsetStep(
          BLOCK_ID_LOOKUP[inputMesh.blockId],
          inputMesh.rotation,
          outputToIndex,
        )
        world.set(
          entity,
          pair(OutputOf, inputEntity),
          encodeOffsetStep(offset, step),
        )
        if (debug)
          this.logger.Debug(
            `Factory ${plot.userId} connected: (${decodeMeshMidpoint(inputEncodedMidpoint)}) -> (${midpoint}) offset (${offset}) step ${step}`,
          )
      }
    })
  }
}
