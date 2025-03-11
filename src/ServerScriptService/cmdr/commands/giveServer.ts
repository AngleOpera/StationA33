import { CommandContext } from '@rbxts/cmdr'
import { InventoryItemName } from 'ReplicatedStorage/shared/constants/core'
import { store } from 'ServerScriptService/store'

export = function (
  _context: CommandContext,
  player: Player,
  itemName: CurrencyName | InventoryItemName,
  amount: number,
) {
  if (itemName === 'Credits') {
    store.updatePlayerCurrency(player.UserId, itemName, amount)
  }
}
