import { Device } from '@rbxts/device'
import Object from '@rbxts/object-utils'
import { Players, RunService } from '@rbxts/services'
import { $NODE_ENV } from 'rbxts-transform-env'
import inventoryConstants from 'ReplicatedStorage/shared/constants/inventory.json'

export type InventoryItemName = keyof typeof inventoryConstants

export interface InventoryItemDescription {
  blockId: number
  name: InventoryItemName
  size: ItemVector3
  description?: string
  image?: string
  inputFrom?: ItemVector3[]
  inputTo?: ItemVector3[]
  parent?: string
  outputFrom?: ItemVector3[]
  outputTo?: ItemVector3[]
  placeable?: boolean
  price?: number
  stackable?: boolean
}

export enum Step {
  Forward = 0,
  Right = 1,
  Backward = 2,
  Left = 3,
}

export const IS_PROD = $NODE_ENV === 'production'
export const IS_CANARY = $NODE_ENV === 'canary'
export const IS_STUDIO = RunService.IsStudio()
export const IS_SERVER = RunService.IsServer()
export const IS_CLIENT = RunService.IsClient()
export const IS_EDIT = IS_STUDIO && !RunService.IsRunning()

export const PROFILESTORE_USER_TEMPLATE = '%d_Data'
export const PROFILESTORE_NAME = RunService.IsStudio()
  ? 'Testing'
  : 'Production'

export const START_PLACE_ID = IS_PROD ? 72252931528624 : 72252931528624

export const USER_DEVICE = Device.GetPlatformType()
export const USER_ID = Players.LocalPlayer ? Players.LocalPlayer.UserId : 0
export const USER_NAME = Players.LocalPlayer
  ? Players.LocalPlayer.Name
  : '(server)'

export const ANIMATIONS = {
  BreakBlock: 'BreakBlock' as const,
  MoveModel: 'MoveModel' as const,
  NewFactoryBlock: 'NewFactoryBlock' as const,
}

export const BLOCK_ATTRIBUTE: Record<keyof BlockAttributes, string> = {
  BlockId: 'BlockId' as const,
  Damage: 'Damage' as const,
  EntityId: 'EntityId' as const,
}

export const BLOCK_ID_LOOKUP: Record<number, InventoryItemDescription> =
  Object.fromEntries(
    Object.values(inventoryConstants).map((item) => [
      item.blockId,
      item as InventoryItemDescription,
    ]),
  )

export const BLOCK_CHILD: Record<keyof BlockBase, string> = {
  Bounding: 'Bounding' as const,
}

export const CURRENCY_NAME: {
  [name in CurrencyName]: CurrencyName
} = {
  Credits: 'Credits' as const,
}

export const CURRENCY_NAMES: CurrencyName[] = Object.keys(CURRENCY_NAME)

export const GAME_MODE: {
  [name in GameMode]: GameMode
} = {
  Creative: 'Creative' as const,
  Default: 'Default' as const,
}

export const MORPH_NAME: {
  [name in MorphName]: MorphName
} = {
  None: 'None' as const,
  Speakerman: 'Speakerman' as const,
  Spacesuit: 'Spacesuit' as const,
}

export const PLOT_LOCATION: {
  [name in PlotLocation]: PlotLocation
} = {
  Acraos: 'Acraos' as const,
  Apeace: 'Apeace' as const,
  Earth: 'Earth' as const,
}

export const PLACE_PLOT_LOCATION = (() => {
  switch (game.PlaceId) {
    case START_PLACE_ID:
    default:
      return PLOT_LOCATION.Apeace
  }
})()

export const INVENTORY = inventoryConstants as Record<
  InventoryItemName,
  InventoryItemDescription
>

export const INVENTORY_LOOKUP = inventoryConstants as Record<
  string,
  InventoryItemDescription
>

export const INVENTORY_NAMES: InventoryItemName[] = Object.values(INVENTORY)
  .filter((x) => !x.parent)
  .map((item) => item.name)

export const PLACEABLE_INVENTORY: Record<InventoryItemName, number> =
  Object.fromEntries(
    INVENTORY_NAMES.filter((name) => INVENTORY[name].placeable !== false).map(
      (name) => [name, 0],
    ),
  )

export const INVENTORY_ID = Object.fromEntries(
  Object.values(INVENTORY).map((item) => [item.blockId, item]),
)

export const PLOT_NAME: PlotName[] = [
  'Plot1' as const,
  'Plot2' as const,
  'Plot3' as const,
  'Plot4' as const,
]

export const TYPE = {
  Attachment: 'Attachment' as const,
  BasePart: 'BasePart' as const,
  BillboardGui: 'BillboardGui' as const,
  Frame: 'Frame' as const,
  Folder: 'Folder' as const,
  Humanoid: 'Humanoid' as const,
  Model: 'Model' as const,
  TextLabel: 'TextLabel' as const,
  UIStroke: 'UIStroke' as const,
}
