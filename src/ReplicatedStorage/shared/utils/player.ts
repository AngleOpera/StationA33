import { Players, Workspace } from '@rbxts/services'

export type PlayerReceivingFunction = (player: Player) => unknown

export const getCharacter = (player: Player) =>
  player.Character as PlayerCharacter | undefined

export function isSameTeam(player1: Player, player2: Player) {
  return (
    player1 &&
    player2 &&
    !player1.Neutral &&
    !player2.Neutral &&
    player1.TeamColor === player2.TeamColor
  )
}

export function forEveryPlayer(
  joinFunc: PlayerReceivingFunction,
  leaveFunc?: PlayerReceivingFunction,
): Array<RBXScriptConnection> {
  const events: Array<RBXScriptConnection> = []
  const spawnJoinFunc = (player: Player) => task.spawn(() => joinFunc(player))

  Players.GetPlayers().forEach(spawnJoinFunc)
  events.push(Players.PlayerAdded.Connect(joinFunc))
  if (leaveFunc) events.push(Players.PlayerRemoving.Connect(leaveFunc))

  return events
}

export function morphPlayer(player: Player, morphTemplate: PlayerCharacter) {
  const morph = morphTemplate.Clone()
  morph.Name = player.Name

  const morphRoot =
    morph.FindFirstChild<BasePart>('HumanoidRootPart') ||
    morph.FindFirstChild<BasePart>('Torso')
  const playerRoot =
    player.Character?.FindFirstChild<BasePart>('HumanoidRootPart') ||
    player.Character?.FindFirstChild<BasePart>('Torso')
  if (morphRoot && playerRoot) morphRoot.CFrame = playerRoot.CFrame

  player.Character = morph
  morph.Parent = Workspace
  return morph
}
