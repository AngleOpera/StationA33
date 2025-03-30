import { CommandContext } from '@rbxts/cmdr'
import {
  CURRENCY_NAME,
  INVENTORY,
  InventoryItemName,
} from 'ReplicatedStorage/shared/constants/core'
import { getLogger } from 'ReplicatedStorage/shared/utils/core'
import { store } from 'ServerScriptService/store'

export = function (
  _context: CommandContext,
  player: Player,
  itemName: CurrencyName | InventoryItemName,
  amount: number,
) {
  if (itemName === CURRENCY_NAME.Credits) {
    store.updatePlayerCurrency(player.UserId, itemName, amount)
    getLogger().Info(`Gave ${player.Name} ${amount} ${itemName}`)
    return
  }
  const item = INVENTORY[itemName]
  if (item) {
    store.updatePlayerInventory(player.UserId, itemName, amount)
    getLogger().Info(`Gave ${player.Name} ${amount} ${itemName}`)
    return
  }
}
