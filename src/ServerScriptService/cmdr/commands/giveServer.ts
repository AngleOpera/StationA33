import { Dependency } from '@flamework/core'
import { CommandContext } from '@rbxts/cmdr'
import { Logger } from '@rbxts/log'
import {
  CURRENCY_NAME,
  INVENTORY,
  InventoryItemName,
} from 'ReplicatedStorage/shared/constants/core'
import { store } from 'ServerScriptService/store'

export = function (
  _context: CommandContext,
  player: Player,
  itemName: CurrencyName | InventoryItemName,
  amount: number,
) {
  const logger = Dependency<Logger>()
  if (itemName === CURRENCY_NAME.Credits) {
    store.updatePlayerCurrency(player.UserId, itemName, amount)
    logger.Info(`Gave ${player.Name} ${amount} ${itemName}`)
    return
  }
  const item = INVENTORY[itemName]
  if (item) {
    store.updatePlayerInventory(player.UserId, itemName, amount)
    logger.Info(`Gave ${player.Name} ${amount} ${itemName}`)
    return
  }
}
