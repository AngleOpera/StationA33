import { Dependency } from '@flamework/core'
import { CommandContext } from '@rbxts/cmdr'
import { PlaceBlockService } from 'ServerScriptService/services/PlaceBlockService'

export = function (
  _context: CommandContext,
  player: Player,
  command: 'clear' | 'reload',
) {
  const placeBlockService = Dependency<PlaceBlockService>()
  switch (command) {
    case 'reload':
      placeBlockService.reloadPlayerSandbox(player)
      break
  }
}
