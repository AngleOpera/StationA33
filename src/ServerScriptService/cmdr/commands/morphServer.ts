import { CommandContext } from '@rbxts/cmdr'
import { ReplicatedStorage } from '@rbxts/services'
import { MORPH_NAME } from 'ReplicatedStorage/shared/constants/core'
import {
  getCharacter,
  morphPlayer,
} from 'ReplicatedStorage/shared/utils/player'

export = function (
  _context: CommandContext,
  player: Player,
  morphName: MorphName,
) {
  if (morphName === MORPH_NAME.None) {
    const character = getCharacter(player)
    const cframe = character?.PrimaryPart?.CFrame
    player.LoadCharacter()
    if (cframe) {
      task.defer(() => getCharacter(player)?.SetPrimaryPartCFrame(cframe))
    }
    return
  }
  const morph =
    ReplicatedStorage.Morphs.FindFirstChild<PlayerCharacter>(morphName)
  if (!morph) return
  morphPlayer(player, morph)
}
