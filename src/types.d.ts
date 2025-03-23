interface BlockAttributes {
  BlockId: number
  Damage?: number
}

interface BlockBase {
  Bounding?: BasePart
}

interface Block extends Model, BlockBase {}

interface BlockPreview extends BasePart {
  SelectionBox: SelectionBox
}

interface BreakBlockTool extends Tool {}

interface BlockBreakerAttributes {
  MaxDistance: number
}

interface EntityAttributes {
  EntityId: number
}

interface PlaceBlockTool extends Tool {}

interface PlaceBlockToolAttributes {
  MaxDistance: number
}

type CurrencyName = 'Credits'

interface Door extends BasePart {
  ClickDetector: ClickDetector
}

interface Instance {
  FindFirstChild<X = Instance>(
    this: Instance,
    childName: string | number,
    recursive?: boolean,
  ): X | undefined

  GetChildren<X = Instance>(this: Instance): Array<X>

  WaitForChild<X = Instance>(this: Instance, childName: string | number): X
}

interface InventoryItem extends Model {}

type ItemVector3 = number[]

interface Leaderboard extends Model {
  Leaderboard: Part & {
    SurfaceGui: SurfaceGui & {
      Frame: Frame & {
        List: ScrollingFrame
      }
    }
    ItemTemplate: Frame & {
      PlayerName: TextLabel
      Photo: ImageLabel
      Rank: TextLabel
      Value: TextLabel
    }
  }
}

type MorphName = 'None' | 'Speakerman' | 'Spacesuit'

interface Planet extends Folder {
  Baseplate: BasePart
  // LeaderboardCredits: Leaderboard
  Plot1: BasePart
  Plot2: BasePart
  Plot3: BasePart
  Plot4: BasePart
}

interface PlayerCharacter extends Model {
  Humanoid: Humanoid
}

interface PlayerSpace extends Folder {
  PlacedBlocks: Model
  PlaceBlockPreview: Model
  Plot: Plot
  Ships: Folder & Partial<Record<ShipName, Ship>>
}

interface Plot extends Model {
  Baseplate: BasePart
  // ShipSpawner: ShipSpawner
  SpawnLocation: SpawnLocation
}

type PlotLocation = 'Acraos' | 'Apeace' | 'Earth'

type PlotName = 'Plot1' | 'Plot2' | 'Plot3' | 'Plot4'

interface ReplicatedStorage extends Instance {
  Common: Folder & {
    Beam: Beam
    LootBox: Model
    BreakBlockPreview: BlockPreview
    PlaceBlockPreview: BlockPreview
    Plot: Plot
  }
  Items: Folder &
    Record<string, InventoryItem> & {
      Conveyor: InventoryItem
    }
  Morphs: Folder & Record<MorphName, PlayerCharacter>
  Ships: Folder & {
    OlReliable: Ship
  }
  Tools: Folder & {
    PickAxe: Tool & {
      Handle: BasePart
    }
    BreakBlock: BreakBlockTool
    PlaceBlock: PlaceBlockTool
  }
}

interface Ship extends Model {
  Body: BasePart
  Guns: Model & {
    Gun1: Model & {
      Muzzle: BasePart
    }
    Gun2: Model & {
      Muzzle: BasePart
    }
  }
  Seat: Seat
  Shoot: RemoteEvent
}

interface ShipConfig {
  gunsEnabled: boolean
  speed: number
  turnSpeed: number
}

interface ShipMobileGui extends ScreenGui {
  Throttle: Frame & {
    Slider: TextButton
  }
}

type ShipName = 'OlReliable'

interface Shooter extends Tool {
  MouseEvent: RemoteEvent
  Handle: BasePart & {
    Fire: Sound
    GunFirePoint: Attachment
    ImpactParticle: ParticleEmitter
  }
}

interface SpawnerAttributes {
  MinDelay?: number
  MaxDelay?: number
  MaxTotal?: number
  SpawnHeight?: number
  SpawnItem?: string
}

interface Swinger extends Tool {
  Handle: BasePart & {
    Sheath?: Sound
    Unsheath?: Sound
  }
}

interface SwingerAttributes {
  SwingName?: string
}

interface Workspace extends Instance {
  Audio: Folder & {
    BlockBroken: Sound
    BlockPlaced: Sound
  }
  Planet: Planet
  PlayerSpaces: Folder & Record<string, PlayerSpace>
}
