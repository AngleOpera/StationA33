import { Device } from '@rbxts/device'
import Object from '@rbxts/object-utils'
import { Players, RunService } from '@rbxts/services'
import { $NODE_ENV } from 'rbxts-transform-env'
import inventoryConstants from 'ReplicatedStorage/shared/constants/inventory.json'

export const IS_PROD = $NODE_ENV === 'production'
export const IS_CANARY = $NODE_ENV === 'canary'
export const IS_STUDIO = RunService.IsStudio()
export const IS_EDIT = IS_STUDIO && !RunService.IsRunning()

export const START_PLACE_ID = IS_PROD ? 72252931528624 : 72252931528624

export const USER_DEVICE = Device.GetPlatformType()
export const USER_ID = Players.LocalPlayer ? Players.LocalPlayer.UserId : 0
export const USER_NAME = Players.LocalPlayer
  ? Players.LocalPlayer.Name
  : '(server)'

export const CURRENCY_NAME: {
  [name in CurrencyName]: CurrencyName
} = {
  Credits: 'Credits' as const,
}

export type InventoryItemName = keyof typeof inventoryConstants

export interface InventoryItemDescription {
  id: number
  name: InventoryItemName
  description: string
  price: number
  image: string
  width: number
  height: number
  length: number
  stackable?: boolean
}

export const INVENTORY = inventoryConstants as Record<
  InventoryItemName,
  InventoryItemDescription
>

export const INVENTORY_NAMES: InventoryItemName[] = Object.keys(INVENTORY)

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
