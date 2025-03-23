import { Registry } from '@rbxts/cmdr'
import Object from '@rbxts/object-utils'
import { MORPH_NAME } from 'ReplicatedStorage/shared/constants/core'

export = function (registry: Registry) {
  registry.RegisterType(
    'morph',
    registry.Cmdr.Util.MakeEnumType('morph', [...Object.keys(MORPH_NAME)]),
  )
}
