import { combineProducers, createSelector, InferState } from '@rbxts/reflex'
import { slices } from 'ReplicatedStorage/shared/state'
import { alertSlice } from 'StarterPlayer/StarterPlayerScripts/store/AlertState'
import {
  MenuPage,
  menuSlice,
} from 'StarterPlayer/StarterPlayerScripts/store/MenuState'
import { receiverMiddleware } from 'StarterPlayer/StarterPlayerScripts/store/middleware/receiver'

export type RootStore = typeof store
export type RootState = InferState<RootStore>

export const selectAlerts = (state: RootState) => {
  return state.alert.alerts
}

export const selectAlertsVisible = createSelector(selectAlerts, (alerts) => {
  return alerts.filter((alert) => alert.visible)
})

export const selectAlertIndex = (id: number) => {
  return createSelector(selectAlertsVisible, (alerts) => {
    return alerts.findIndex((alert) => alert.id === id)
  })
}

export async function dismissAlert(id: number) {
  store.setAlertVisible(id, false)
  return Promise.delay(0.25).then(() => {
    store.removeAlert(id)
    return id
  })
}

export const selectCurrentPage = (state: RootState) => {
  return state.menu.page
}

export const selectIsMenuOpen = (state: RootState) => {
  return state.menu.open
}

export const selectIsPageOpen = (page: MenuPage) => {
  return (state: RootState) => state.menu.open && state.menu.page === page
}

export const selectIsPageOpenWithContainer = (page: MenuPage) => {
  const selectOpened = selectIsPageOpen(page)
  return (state: RootState) => ({
    opened: selectOpened(state),
    container: state.menu.container,
  })
}

export const selectMenuTransition = (state: RootState) => {
  return state.menu.transition
}

export function createStore() {
  const store = combineProducers({
    ...slices,
    alert: alertSlice,
    menu: menuSlice,
  })
  store.applyMiddleware(receiverMiddleware())
  return store
}

export const store = createStore()
