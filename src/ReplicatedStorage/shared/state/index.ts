import { CombineProducers, CombineStates } from '@rbxts/reflex'
import {
  InventoryItemName,
  USER_ID,
} from 'ReplicatedStorage/shared/constants/core'
import {
  getPlayerCurrency,
  getPlayerState,
  playersSlice,
} from 'ReplicatedStorage/shared/state/PlayersState'

export type SharedState = CombineStates<typeof slices>
export type SharedStore = CombineProducers<typeof slices>

export const slices = {
  players: playersSlice,
}

export const selectPlayersState = () => (state: SharedState) => state.players

export const selectPlayerState = (userID: number) => (state: SharedState) =>
  getPlayerState(state.players, userID)

export const selectPlayerCurrency =
  (userID: number, currency: CurrencyName) => (state: SharedState) =>
    getPlayerCurrency(getPlayerState(state.players, userID), currency)

export const selectPlayerContainer =
  (userID: number, container: string) => (state: SharedState) =>
    getPlayerState(state.players, userID)?.containers?.[container]

export const selectPlayerInventory = (userID: number) => (state: SharedState) =>
  getPlayerState(state.players, userID)?.inventory

export const selectPlayerInventoryItem =
  (userID: number, item: InventoryItemName) => (state: SharedState) =>
    getPlayerState(state.players, userID)?.inventory?.[item]

export const selectPlayerGuideEnabled =
  (userID: number) => (state: SharedState) =>
    getPlayerState(state.players, userID)?.settings?.guide

export const selectLocalPlayerState = () => (state: SharedState) =>
  getPlayerState(state.players, USER_ID)

export const selectLocalPlayerMusicEnabled = () => (state: SharedState) =>
  getPlayerState(state.players, USER_ID)?.settings?.music
