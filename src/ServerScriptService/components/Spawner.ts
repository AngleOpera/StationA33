import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { ReplicatedStorage } from '@rbxts/services'
import {
  BLOCK_ATTRIBUTE,
  INVENTORY_LOOKUP,
  InventoryItemDescription,
} from 'ReplicatedStorage/shared/constants/core'
import { SpawnerTag } from 'ReplicatedStorage/shared/constants/tags'
import { getRandomLocation } from 'ReplicatedStorage/shared/utils/part'

@Component({ tag: SpawnerTag })
export class SpawnerComponent
  extends BaseComponent<SpawnerAttributes, BasePart>
  implements OnStart
{
  minDelay = 10
  maxDelay = 60
  maxTotal = 100
  initTotal = 70
  spawnHeight = 0
  totalSpawned = 0

  constructor() {
    super()
  }

  onStart() {
    this.minDelay = this.attributes.MinDelay ?? this.minDelay
    this.maxDelay = this.attributes.MaxDelay ?? this.maxDelay
    this.maxTotal = this.attributes.MaxTotal ?? this.maxTotal
    this.spawnHeight = this.attributes.SpawnHeight ?? this.spawnHeight

    if (this.attributes.SpawnItem) {
      while (
        this.instance &&
        this.instance.GetChildren().size() < this.initTotal
      )
        this.spawn()
    }

    while (
      this.instance &&
      wait(math.random(this.minDelay, this.maxDelay))[0]
    ) {
      const numChildren = this.instance.GetChildren().size()
      if (numChildren >= this.maxTotal) continue
      this.spawn()
    }
  }

  spawn() {
    if (!this.attributes.SpawnItem) return
    this.spawnItem(
      ReplicatedStorage.Items.FindFirstChild<Model>(this.attributes.SpawnItem),
      INVENTORY_LOOKUP[this.attributes.SpawnItem],
    )
  }

  spawnItem(resourceTemplate?: Model, item?: InventoryItemDescription) {
    if (!resourceTemplate || !item) return
    this.totalSpawned++
    const resource = resourceTemplate.Clone()
    resource.Name = `${resource.Name}${this.totalSpawned}`
    resource.SetAttribute(BLOCK_ATTRIBUTE.BlockId, item.blockId)
    resource.PivotTo(
      getRandomLocation(
        this.instance,
        this.spawnHeight + resource.GetBoundingBox()[1].Y / 2,
      ),
    )
    resource.Parent = this.instance
  }
}
