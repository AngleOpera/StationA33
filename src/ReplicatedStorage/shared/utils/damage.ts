import { Debris } from '@rbxts/services'
import {
  BLOCK_ATTRIBUTE,
  InventoryItemDescription,
} from 'ReplicatedStorage/shared/constants/core'
import { SharedStore } from 'ReplicatedStorage/shared/state'

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

export function takeBlockDamage(
  block: Model,
  damage: number,
  item?: InventoryItemDescription,
  serverStore?: SharedStore,
  attackerUserId?: number,
) {
  const damageAttribute = block.GetAttribute(BLOCK_ATTRIBUTE.Damage)
  const currentDamage = typeIs(damageAttribute, 'number') ? damageAttribute : 0
  const newDamage = currentDamage + damage
  if (newDamage <= 3) {
    block.SetAttribute(BLOCK_ATTRIBUTE.Damage, newDamage)
    return
  }
  block.Destroy()
  if (item && serverStore && attackerUserId) {
    serverStore.updatePlayerInventory(attackerUserId, item.name, 1)
  }
}
