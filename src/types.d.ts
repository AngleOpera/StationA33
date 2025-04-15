interface Bot extends Model {
  Humanoid: Humanoid
}

type BotName =
  | 'AlienBioHazard'
  | 'CircuitBreaker'
  | 'CombatRobot'
  | 'CubeForce'
  | 'CyberClaw'
  | 'ImperialGunner'
  | 'SecurityRobot'

interface BlockAttributes {
  BlockId: number
  Damage?: number
  Debounce?: boolean
  EntityId?: number
  OriginalColor?: Color3
  OriginalMaterial?: Enum.Material
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

interface PlaceBlockTool extends Tool {}

interface PlaceBlockToolAttributes {
  MaxDistance: number
}

type CurrencyName = 'Credits'

interface Door extends Model {
  ClickDetector: ClickDetector
}

type GameMode = 'Creative' | 'Default'

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

type MessageType = 'key' | 'text'

interface MessageContent {
  value: string
  type?: MessageType
  color?: Color3
  colorSecondary?: Color3
}

type MorphName = 'None' | 'Speakerman' | 'Spacesuit'

interface Planet extends Folder {
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
  Pad: Model
  SpawnLocation: SpawnLocation
}

type PlotLocation = 'Acraos' | 'Apeace' | 'Earth'

type PlotName = 'Plot1' | 'Plot2' | 'Plot3' | 'Plot4'

interface ReplicatedStorage extends Instance {
  BehaviorTrees: Folder & {
    Bot: Folder
  }
  Bots: Folder & Record<BotName, Model>
  Common: Folder & {
    Beam: Beam
    LootBox: Model
    BreakBlockPreview: BlockPreview
    PlaceBlockPreview: BlockPreview
  }
  Items: Folder &
    Record<string, InventoryItem> & {
      Conveyor: InventoryItem
    }
  Morphs: Folder & Record<MorphName, PlayerCharacter>
  Plot: Plot
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

interface ShipSpawner extends Model {
  Screen: BasePart & {
    SurfaceGui: SurfaceGui
  }
}

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

interface StarterPlayer extends Instance {
  StarterCharacterScripts: Folder
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
  Animating: Folder & {
    Items: Folder
  }
  Bots: Folder & Record<string, Bot>
  Planet: Planet
  PlayerSpaces: Folder &
    Record<string, PlayerSpace> & {
      '0': PlayerSpace
    }
}
