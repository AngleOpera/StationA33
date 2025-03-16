import { Dependency } from '@flamework/core'
import { CommandContext } from '@rbxts/cmdr'
import { MeshService } from 'ServerScriptService/services/MeshService'

export = function (
  _context: CommandContext,
  player: Player,
  command: 'clear' | 'reload',
) {
  const placeBlockService = Dependency<MeshService>()
  switch (command) {
    case 'reload':
      placeBlockService.reloadPlayerSandbox(player)
      break
  }
}
