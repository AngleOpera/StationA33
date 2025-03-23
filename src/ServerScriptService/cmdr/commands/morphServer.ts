import { CommandContext } from '@rbxts/cmdr'
import { ReplicatedStorage } from '@rbxts/services'
import { morphPlayer } from 'ReplicatedStorage/shared/utils/player'

export = function (
  _context: CommandContext,
  player: Player,
  morphName: MorphName,
) {
  const morph =
    ReplicatedStorage.Morphs.FindFirstChild<PlayerCharacter>(morphName)
  if (!morph) return
  morphPlayer(player, morph)
}
