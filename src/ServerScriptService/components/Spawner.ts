import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { SpawnerTag } from 'ReplicatedStorage/shared/constants/tags'

@Component({ tag: SpawnerTag })
export class SpawnerComponent
  extends BaseComponent<SpawnerAttributes, BasePart>
  implements OnStart
{
  minDelay = 10
  maxDelay = 60
  maxTotal = 10
  spawnHeight = 0

  constructor() {
    super()
  }

  onStart() {
    this.minDelay = this.attributes.MinDelay ?? this.minDelay
    this.maxDelay = this.attributes.MaxDelay ?? this.maxDelay
    this.maxTotal = this.attributes.MaxTotal ?? this.maxTotal
    this.spawnHeight = this.attributes.SpawnHeight ?? this.spawnHeight

    // while (wait(math.random(10, 60))[0]) this.dropLootBox()
  }

  getRandomSpawnLocation() {
    const radius = math.min(this.instance.Size.X, this.instance.Size.Z) / 2
    const randomAngle = math.random() * math.pi * 2
    return this.instance.CFrame.ToWorldSpace(
      new CFrame(
        math.cos(randomAngle) * radius,
        this.spawnHeight,
        math.sin(randomAngle) * radius,
      ),
    )
  }

  /*
    const lootBox = ReplicatedStorage.Common.LootBox.Clone()
    weldParts(findDescendentsWhichAre<BasePart>(lootBox, 'BasePart'))
    lootBox.PivotTo(this.mapService.getRandomSpawnLocation(150))
    lootBox.Parent = Workspace
    Debris.AddItem(lootBox, 35)
    */
}
