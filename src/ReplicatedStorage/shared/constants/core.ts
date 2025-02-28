import { Device } from '@rbxts/device'
import { Players, RunService } from '@rbxts/services'
import { $NODE_ENV } from 'rbxts-transform-env'

export const IS_PROD = $NODE_ENV === 'production'
export const IS_CANARY = $NODE_ENV === 'canary'
export const IS_STUDIO = RunService.IsStudio()
export const IS_EDIT = IS_STUDIO && !RunService.IsRunning()

export const START_PLACE_ID = IS_PROD ? -1 : 72252931528624

export const USER_ID = Players.LocalPlayer ? Players.LocalPlayer.UserId : 0
export const USER_NAME = Players.LocalPlayer
  ? Players.LocalPlayer.Name
  : '(server)'

export const USER_DEVICE = Device.GetPlatformType()
