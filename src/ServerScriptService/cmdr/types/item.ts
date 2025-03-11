import { Registry } from '@rbxts/cmdr'
import {
  CURRENCY_NAMES,
  INVENTORY_NAMES,
} from 'ReplicatedStorage/shared/constants/core'

export = function (registry: Registry) {
  registry.RegisterType(
    'item',
    registry.Cmdr.Util.MakeEnumType('item', [
      ...CURRENCY_NAMES,
      ...INVENTORY_NAMES,
    ]),
  )
}
