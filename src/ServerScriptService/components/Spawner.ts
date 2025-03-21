import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { ReplicatedStorage } from '@rbxts/services'
import {
  BLOCK_ATTRIBUTE,
  INVENTORY_LOOKUP,
  InventoryItemDescription,
} from 'ReplicatedStorage/shared/constants/core'
import { SpawnerTag } from 'ReplicatedStorage/shared/constants/tags'

@Component({ tag: SpawnerTag })
export class SpawnerComponent
  extends BaseComponent<SpawnerAttributes, BasePart>
  implements OnStart
{
  minDelay = 10
  maxDelay = 60
  maxTotal = 100
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

    while (
      this.instance &&
      wait(math.random(this.minDelay, this.maxDelay))[0]
    ) {
      const numChildren = this.instance.GetChildren().size()
      if (numChildren >= this.maxTotal) continue
      if (this.attributes.SpawnItem)
        this.spawnItem(
          ReplicatedStorage.Items.FindFirstChild<Model>(
            this.attributes.SpawnItem,
          ),
          INVENTORY_LOOKUP[this.attributes.SpawnItem],
        )
    }
  }

  spawnItem(resourceTemplate?: Model, item?: InventoryItemDescription) {
    if (!resourceTemplate || !item) return
    this.totalSpawned++
    const resource = resourceTemplate.Clone()
    resource.Name = `${resource.Name}${this.totalSpawned}`
    resource.SetAttribute(BLOCK_ATTRIBUTE.BlockId, item.blockId)
    resource.PivotTo(
      this.getRandomSpawnLocation(resource.GetBoundingBox()[1].Y / 2),
    )
    resource.Parent = this.instance
  }

  getRandomSpawnLocation(height: number) {
    const radius = math.min(this.instance.Size.X, this.instance.Size.Z) / 2
    const randomAngle = math.random() * math.pi * 2
    return this.instance.CFrame.ToWorldSpace(
      new CFrame(
        math.cos(randomAngle) * radius,
        this.spawnHeight + height,
        math.sin(randomAngle) * radius,
      ),
    )
  }
}
