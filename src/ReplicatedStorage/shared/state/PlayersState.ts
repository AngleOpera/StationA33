import Object from '@rbxts/object-utils'
import { createProducer } from '@rbxts/reflex'
import { Players } from '@rbxts/services'
import {
  GAME_MODE,
  InventoryItemName,
  PLOT_NAME,
} from 'ReplicatedStorage/shared/constants/core'

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

export interface GamePassData {
  active: boolean
}

export interface ProductData {
  timesPurchased: number
}

export interface PlayerData {
  readonly credits: number
  readonly inventory: Partial<Record<InventoryItemName, number>>
  readonly containers: Record<
    string,
    Partial<Record<InventoryItemName, number>>
  >
  readonly settings: PlayerSettings
  readonly gamePasses: Partial<PlayerGamePasses>
  readonly products: Partial<PlayerProducts>
  readonly receiptHistory: string[]
}

export interface PlayerDetail {
  readonly name: string
  readonly gamemode: GameMode
  readonly plotName: PlotName
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
  containers: {},
  settings: defaultPlayerSettings,
  gamePasses: {},
  products: {},
  receiptHistory: [],
} as const

export const defaultPlayerDetail: PlayerDetail = {
  name: '',
  gamemode: GAME_MODE.Default,
  plotName: PLOT_NAME[0],
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
  inventory: state.inventory,
  containers: state.containers,
  settings: state.settings,
  gamePasses: state.gamePasses,
  products: state.products,
  receiptHistory: state.receiptHistory,
})

export function getPlayerDataCurrencyKey(currency: CurrencyName): 'credits' {
  switch (currency) {
    case 'Credits':
      return 'credits'
  }
}

export const getPlayerCurrency = (
  playerState: PlayerState | undefined,
  currency: CurrencyName,
) => playerState?.[getPlayerDataCurrencyKey(currency)] || 0

export const getPlayerGamePass = (
  playerState: PlayerState | undefined,
  gamePassId: GamePass,
) => playerState?.gamePasses?.[gamePassId]?.active ?? false

const getPlayerKey = (userID: number) => KEY_TEMPLATE.format(userID)

export const getPlayerState = (state: Players, userID: number) =>
  state[getPlayerKey(userID)]

export const playersSlice = createProducer(initialState, {
  loadPlayerData: (
    state,
    userID: number,
    playerName: string,
    data?: PlayerData,
  ): Players => {
    const playerKey = getPlayerKey(userID)
    const playerState = state[playerKey]

    let plotName = playerState?.plotName
    if (!plotName) {
      const seenPlotNames = new Set<PlotName>()
      for (const [key, player] of Object.entries(state)) {
        if (key === playerKey) continue
        seenPlotNames.add(player.plotName)
      }

      for (const name of PLOT_NAME) {
        if (!seenPlotNames.has(name)) {
          plotName = name
          break
        }
      }
      if (!plotName) throw 'No available plot'
    }

    return {
      ...state,
      [playerKey]: {
        ...defaultPlayerState,
        ...playerState,
        ...data,
        ...defaultPlayerDetail,
        name: playerName,
        plotName,
        sessionStartTime: os.time(),
      },
    }
  },

  closePlayerData: (state, userID: number): Players => ({
    ...state,
    [getPlayerKey(userID)]: undefined,
  }),

  setPlayerGameMode: (state, userID: number, gamemode: GameMode): Players => {
    const playerKey = getPlayerKey(userID)
    const playerState = state[playerKey]
    if (!playerState) return state
    return {
      ...state,
      [playerKey]: {
        ...playerState,
        gamemode,
      },
    }
  },

  updatePlayerCurrency: (
    state,
    userID: number,
    currency: CurrencyName,
    delta: number,
  ): Players => {
    const playerKey = getPlayerKey(userID)
    const playerState = state[playerKey]
    const currencyField = getPlayerDataCurrencyKey(currency)
    const playerCurrency = playerState?.[currencyField] || 0
    if (!playerState || (delta < 0 && playerCurrency < math.abs(delta)))
      return state
    return {
      ...state,
      [playerKey]: {
        ...playerState,
        [currencyField]: math.max(0, playerCurrency + (delta || 0)),
      },
    }
  },

  updatePlayerInventory: (
    state,
    userID: number,
    itemName: InventoryItemName,
    delta: number,
  ): Players => {
    const playerKey = getPlayerKey(userID)
    const playerState = state[playerKey]
    const playerItems = playerState?.inventory[itemName] || 0
    if (!playerState || (delta < 0 && playerItems < math.abs(delta)))
      return state
    return {
      ...state,
      [playerKey]: {
        ...playerState,
        inventory: {
          ...playerState.inventory,
          [itemName]: math.max(0, playerItems + (delta || 0)),
        },
      },
    }
  },

  movePlayerItem: (
    state,
    userID: number,
    containerName: string,
    itemName: InventoryItemName,
    delta: number,
  ): Players => {
    const playerKey = getPlayerKey(userID)
    const playerState = state[playerKey]
    const containerState = playerState?.containers[containerName]
    const containerItems = containerState?.[itemName] || 0
    const playerItems = playerState?.inventory[itemName] || 0
    if (
      !playerState ||
      (delta < 0 && playerItems < math.abs(delta)) ||
      (delta > 0 && containerItems < delta)
    )
      return state

    const newPlayerItems = math.max(0, playerItems + (delta || 0))
    const newContainerItems = math.max(0, containerItems - (delta || 0))
    const newInventoryState = {
      ...playerState.inventory,
      [itemName]: newPlayerItems,
    }
    const newContainerState = {
      ...containerState,
      [itemName]: newContainerItems,
    }
    const newContainersState = {
      ...playerState.containers,
      [containerName]: newContainerState,
    }
    if (newPlayerItems === 0) delete newInventoryState[itemName]
    if (newContainerItems === 0) delete newContainerState[itemName]
    if (Object.keys(newContainerState).size() === 0)
      delete newContainersState[containerName]

    return {
      ...state,
      [playerKey]: {
        ...playerState,
        containers: newContainersState,
        inventory: newInventoryState,
      },
    }
  },

  breakPlayerContainer: (
    state,
    userID: number,
    containerName: string,
  ): Players => {
    const playerKey = getPlayerKey(userID)
    const playerState = state[playerKey]
    const containerState = playerState?.containers[containerName]
    if (!playerState || !containerState) return state
    const containers = { ...playerState.containers }
    delete containers[containerName]
    const inventory = { ...playerState.inventory }
    for (const [itemName, count] of Object.entries(containerState)) {
      inventory[itemName] = (inventory[itemName] || 0) + count
    }
    return {
      ...state,
      [playerKey]: {
        ...playerState,
        containers,
        inventory,
      },
    }
  },

  setGamePassOwned: (state, userID: number, gamePassId: GamePass): Players => {
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

  setPurchasedDeveloperProduct: (
    state,
    userId: number,
    productId: Product,
    purchaseId: string,
  ): Players => {
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
})
