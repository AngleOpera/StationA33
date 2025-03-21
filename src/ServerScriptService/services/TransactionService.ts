import type { OnStart } from '@flamework/core'
import { Service } from '@flamework/core'
import type { Logger } from '@rbxts/log'
import Object from '@rbxts/object-utils'
import { MarketplaceService, Players } from '@rbxts/services'
import { selectPlayerState } from 'ReplicatedStorage/shared/state'
import { GamePass, Product } from 'ReplicatedStorage/shared/state/PlayersState'
import { store } from 'ServerScriptService/store'

export type ProductInfo =
  | AssetProductInfo
  | BundleInfo
  | DeveloperProductInfo
  | GamePassProductInfo
  | SubscriptionProductInfo

export const getGamePassId = (gamePass: GamePass): number => tonumber(gamePass)!

export function getGamePass(gamePassID: number | string): GamePass | undefined {
  switch (`${gamePassID}`) {
    case GamePass.CoolGun:
      return GamePass.CoolGun
    default:
      return undefined
  }
}

export const getProductId = (product: Product): number => tonumber(product)!

export function getProduct(productID: number | string): Product | undefined {
  switch (`${productID}`) {
    case Product.Credits1000:
      return Product.Credits1000
    default:
      return undefined
  }
}

@Service({})
export class TransactionService implements OnStart {
  readonly networkRetryDelay = 2
  readonly networkRetryAttempts = 10
  readonly productInfoCache = new Map<number, ProductInfo>()

  constructor(protected readonly logger: Logger) {}

  onStart() {
    MarketplaceService.PromptGamePassPurchaseFinished.Connect(
      (player, gamePassId, wasPurchased) => {
        const gamePass = getGamePass(gamePassId)
        // Ensure game passId is a valid game passes for our game
        if (!gamePass) {
          this.logger.Warn(
            `Player ${player.Name} attempted to purchased invalid game pass ${gamePass}`,
          )
          return
        }
        this.onGamePassPurchaseFinished(player, gamePass, wasPurchased)
      },
    )
    MarketplaceService.ProcessReceipt = (receiptInfo) =>
      this.onProcessReceipt(receiptInfo)
  }

  onGamePassPurchaseFinished(
    player: Player,
    gamePass: GamePass,
    wasPurchased: boolean,
  ): void {
    if (!wasPurchased) return
    this.logger.Info(`Player ${player.Name} purchased game pass ${gamePass}`)
    store.setGamePassOwned(player.UserId, gamePass)
  }

  onProcessReceipt(receiptInfo: ReceiptInfo): Enum.ProductPurchaseDecision {
    this.logger.Info(
      `Processing receipt ${receiptInfo.PurchaseId} for ${receiptInfo.PlayerId}`,
    )
    const player = Players.GetPlayerByUserId(receiptInfo.PlayerId)
    if (!player) return Enum.ProductPurchaseDecision.NotProcessedYet

    // Ensure productId is a valid product for our game
    const product = getProduct(receiptInfo.ProductId)
    if (!product) {
      this.logger.Warn(
        `Player ${player.Name} attempted to purchased invalid product ${receiptInfo.ProductId}`,
      )
      return Enum.ProductPurchaseDecision.NotProcessedYet
    }

    this.logger.Info(
      `Player ${player.Name} purchased developer product ${receiptInfo.ProductId}`,
    )
    store.setPurchasedDeveloperProduct(
      player.UserId,
      product,
      receiptInfo.PurchaseId,
    )
    return Enum.ProductPurchaseDecision.PurchaseGranted
  }

  reloadPlayerGamePasses(player: Player, userId: number): void {
    const gamePasses =
      store.getState(selectPlayerState(userId))?.gamePasses ?? {}
    const unownedGamePasses = Object.values(GamePass).filter(
      (gamePass) => !gamePasses[gamePass],
    )
    for (const gamePass of unownedGamePasses) {
      Promise.try(() => {
        const owned = MarketplaceService.UserOwnsGamePassAsync(
          player.UserId,
          getGamePassId(gamePass),
        )
        if (owned) store.setGamePassOwned(userId, gamePass)
      }).catch((err) => {
        this.logger.Warn(`Error checking game pass ${gamePass}: ${err}`)
      })
    }
  }

  checkPlayerGamePass(player: Player, gamePass: GamePass): boolean {
    const owned = !!store.getState(selectPlayerState(player.UserId))
      ?.gamePasses?.[gamePass]
    return (
      owned ||
      MarketplaceService.UserOwnsGamePassAsync(
        player.UserId,
        getGamePassId(gamePass),
      )
    )
  }

  getProductInfo(
    infoType: 'GamePass' | 'Product',
    productId: number,
  ): ProductInfo | undefined {
    if (this.productInfoCache.has(productId))
      return this.productInfoCache.get(productId)

    const productInfo = Promise.retryWithDelay(
      async () => {
        return MarketplaceService.GetProductInfo(
          productId,
          Enum.InfoType[infoType],
        )
      },
      this.networkRetryAttempts,
      this.networkRetryDelay,
    )
      .catch(() => {
        this.logger.Warn(`Failed to get price for product ${productId}`)
      })
      .expect()

    if (productInfo === undefined) return undefined
    this.productInfoCache.set(productId, productInfo)
    return productInfo
  }
}
