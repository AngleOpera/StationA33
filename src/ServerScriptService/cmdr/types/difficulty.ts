import { Registry } from '@rbxts/cmdr'

export = function (registry: Registry) {
  registry.RegisterType(
    'difficulty',
    registry.Cmdr.Util.MakeEnumType('difficulty', ['easy', 'medium', 'hard']),
  )
}
