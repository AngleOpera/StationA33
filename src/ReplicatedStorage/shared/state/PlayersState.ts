import { createProducer } from '@rbxts/reflex'
import { Players } from '@rbxts/services'
import { InventoryItemName } from 'ReplicatedStorage/shared/constants/core'

export enum GamePass {
  CoolGun = '1',
}

export enum Product {
  Credits1000 = '2',
}

export interface PlayerSettings {
  readonly guide: boolean
  readonly music: boolean
}

export type PlayerGamePasses = {
  readonly [gamePass in GamePass]: GamePassData
}

export type PlayerProducts = {
  readonly [product in Product]: ProductData
}

export type PlayeInventory = {
  readonly [product in Product]: ProductData
}

export interface GamePassData {
  active: boolean
}

export interface ProductData {
  timesPurchased: number
}

export interface PlayerData {
  readonly credits: number
  readonly inventory: Partial<Record<InventoryItemName, number>>
  readonly settings: PlayerSettings
  readonly gamePasses: Partial<PlayerGamePasses>
  readonly products: Partial<PlayerProducts>
  readonly receiptHistory: string[]
}

export interface PlayerDetail {
  readonly name: string
  readonly sessionStartTime: number
}

export interface PlayerState extends PlayerData, PlayerDetail {}

export type PlayerDataType = keyof PlayerData
export type PlayerDetailType = keyof PlayerDetail

export interface Players {
  readonly [playerKey: string]: PlayerState | undefined
}

export const defaultPlayerSettings: PlayerSettings = {
  guide: true,
  music: true,
} as const

export const defaultPlayerData: PlayerData = {
  credits: 0,
  inventory: {},
  settings: defaultPlayerSettings,
  gamePasses: {},
  products: {},
  receiptHistory: [],
} as const

export const defaultPlayerDetail: PlayerDetail = {
  name: '',
  sessionStartTime: 0,
} as const

export const defaultPlayerState = {
  ...defaultPlayerData,
  ...defaultPlayerDetail,
} as const

const KEY_TEMPLATE = '%d'
const initialState: Players = {}

export const getPlayerData = (state: PlayerState): PlayerData => ({
  credits: state.credits,
  inventory: {},
  settings: state.settings,
  gamePasses: state.gamePasses,
  products: state.products,
  receiptHistory: state.receiptHistory,
})

export function getPlayerDataCurrencyKey(currency: Currency): 'credits' {
  switch (currency) {
    case 'Credits':
      return 'credits'
  }
}

export const getPlayerCurrency = (
  playerState: PlayerState | undefined,
  currency: Currency,
) => playerState?.[getPlayerDataCurrencyKey(currency)] || 0

export const getPlayerGamePass = (
  playerState: PlayerState | undefined,
  gamePassId: GamePass,
) => playerState?.gamePasses?.[gamePassId]?.active ?? false

const getPlayerKey = (userID: number) => KEY_TEMPLATE.format(userID)

export const getPlayerState = (state: Players, userID: number) =>
  state[getPlayerKey(userID)]

export const playersSlice = createProducer(initialState, {
  loadPlayerData: (state, userID: number, name: string, data: PlayerData) => {
    const playerKey = getPlayerKey(userID)
    const playerState = state[playerKey]
    return {
      ...state,
      [playerKey]: {
        ...defaultPlayerState,
        ...playerState,
        ...data,
        ...defaultPlayerDetail,
        name,
        sessionStartTime: os.time(),
      },
    }
  },

  closePlayerData: (state, userID: number) => ({
    ...state,
    [getPlayerKey(userID)]: undefined,
  }),

  addPlayerCurrency: (
    state,
    userID: number,
    currency: Currency,
    amount: number,
  ) => {
    const playerKey = getPlayerKey(userID)
    const playerState = state[playerKey]
    const currencyField = getPlayerDataCurrencyKey(currency)
    const playerCurrency = playerState?.[currencyField] || 0
    if (!playerState || (amount < 0 && playerCurrency < math.abs(amount)))
      return state
    return {
      ...state,
      [playerKey]: {
        ...playerState,
        [currencyField]: math.max(0, playerCurrency + (amount || 0)),
      },
    }
  },

  purchaseDeveloperProduct: (
    state,
    userId: number,
    productId: Product,
    purchaseId: string,
  ) => {
    const playerKey = getPlayerKey(userId)
    const playerState = state[playerKey]
    if (!playerState || playerState.receiptHistory.includes(purchaseId))
      return state
    const receiptHistory = [...playerState.receiptHistory, purchaseId]
    while (receiptHistory.size() > 50) receiptHistory.shift()
    return {
      ...state,
      [playerKey]: {
        ...playerState,
        products: {
          ...playerState.products,
          [productId]: {
            timesPurchased:
              (playerState.products[productId]?.timesPurchased || 0) + 1,
          },
        },
        receiptHistory,
      },
    }
  },

  setGamePassOwned: (state, userID: number, gamePassId: GamePass) => {
    const playerKey = getPlayerKey(userID)
    const playerState = state[playerKey]
    if (!playerState || playerState.gamePasses[gamePassId]?.active) return state
    return {
      ...state,
      [playerKey]: {
        ...playerState,
        gamePasses: {
          ...playerState.gamePasses,
          [gamePassId]: { active: true },
        },
      },
    }
  },
})
