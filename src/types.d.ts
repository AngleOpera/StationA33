interface BlockBreaker extends Tool {
  BreakBlock: RemoteFunction
}

interface BlockBreakerAttributes {
  MaxDistance: number
}

interface BlockPlacer extends Tool {
  PlaceBlock: RemoteFunction
}

interface BlockPlacerAttributes {
  CanFloat: boolean
  Color: Color3
  IsColorRandom: boolean
  Material: string
  MaxDistance: number
}

type Currency = 'Credits'

interface Instance {
  FindFirstChild<X = Instance>(
    this: Instance,
    childName: string | number,
    recursive?: boolean,
  ): X | undefined

  GetChildren<X = Instance>(this: Instance): Array<X>

  WaitForChild<X = Instance>(this: Instance, childName: string | number): X
}

interface InventoryItem {
  name: string
  description: string
  price: number
  image: string
}

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

interface ReplicatedStorage extends Instance {
  Common: Folder & {
    Beam: Beam
    LootBox: Model
    PlaceBlockBlock: Part
    PlaceBlockPreview: Part & {
      SelectionBox: SelectionBox
    }
  }
  Ships: Folder & {
    Spaceship1: Ship
  }
  Tools: Folder & {
    BreakBlock: BlockBreaker
    PlaceBlock: BlockPlacer
  }
}

interface PlayerCharacter extends Model {
  Humanoid: Humanoid
}

interface PlayerSpace extends Folder {
  PlacedBlocks: Model
  PlaceBlockPreview: Model
}

interface Ship extends Model {
  AimPart: BasePart & {
    ShipGui: BillboardGui
    ShipMobileGui: ShipMobileGui
  }
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

interface Shooter extends Tool {
  MouseEvent: RemoteEvent
  Handle: BasePart & {
    Fire: Sound
    GunFirePoint: Attachment
    ImpactParticle: ParticleEmitter
  }
}

interface Workspace extends Instance {
  Audio: Folder & {
    BlockBroken: Sound
    BlockPlaced: Sound
  }
  Baseplate: BasePart
  PlayerSpaces: Folder
}
