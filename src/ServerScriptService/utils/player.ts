import { Debris, Players } from '@rbxts/services'

export type PlayerReceivingFunction = (player: Player) => unknown

export const attackerInstanceName = 'attacker'

export function tagHumanoid(humanoid: Humanoid, userId: number) {
  const attacker = new Instance('IntValue')
  attacker.Name = attackerInstanceName
  attacker.Value = userId
  Debris.AddItem(attacker, 2)
  attacker.Parent = humanoid
}

export function untagHumanoid(humanoid: Humanoid) {
  for (const v of humanoid.GetChildren()) {
    if (v.IsA('IntValue') && v.Name === attackerInstanceName) v.Destroy()
  }
}

export function getAttackerUserId(humanoid: Humanoid): number {
  const attacker = humanoid.FindFirstChild(attackerInstanceName)
  return attacker?.IsA('IntValue') ? attacker.Value : 0
}

export function takeDamage(
  humanoid: Humanoid,
  damage: number,
  attackerUserId?: number,
  _type?: string,
) {
  if (attackerUserId) {
    untagHumanoid(humanoid)
    tagHumanoid(humanoid, attackerUserId)
  }
  humanoid.TakeDamage(damage)
}

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
