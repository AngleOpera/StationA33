import { Registry } from '@rbxts/cmdr'
import Object from '@rbxts/object-utils'
import { GAME_MODE } from 'ReplicatedStorage/shared/constants/core'

export = function (registry: Registry) {
  registry.RegisterType(
    'gamemode',
    registry.Cmdr.Util.MakeEnumType('gamemode', [...Object.keys(GAME_MODE)]),
  )
}
