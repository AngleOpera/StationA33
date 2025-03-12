import { Registry } from '@rbxts/cmdr'

export = function (registry: Registry) {
  registry.RegisterType(
    'plotCommand',
    registry.Cmdr.Util.MakeEnumType('plotCommand', ['clear', 'reload']),
  )
}
