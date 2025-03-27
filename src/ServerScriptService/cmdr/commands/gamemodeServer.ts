import { CommandContext } from '@rbxts/cmdr'
import { store } from 'ServerScriptService/store'

export = function (
  _context: CommandContext,
  player: Player,
  gamemode: GameMode,
) {
  store.setPlayerGameMode(player.UserId, gamemode)
}
