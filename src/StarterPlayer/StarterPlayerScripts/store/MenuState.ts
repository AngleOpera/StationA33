import { createProducer } from '@rbxts/reflex'

export type TransitionDirection = 'left' | 'right'

export const TRANSITION_DIRECTION: {
  [name in TransitionDirection]: TransitionDirection
} = {
  left: 'left' as const,
  right: 'right' as const,
}

export interface MenuState {
  readonly open: boolean
  readonly page: MenuPage
  readonly transition: {
    readonly direction: 'left' | 'right'
    readonly counter: number
  }
  readonly container?: string
}

export type MenuPage = 'Inventory' | 'Main' | 'Store' | 'Trade'

export const MENU_PAGE: {
  [name in MenuPage]: MenuPage
} = {
  Inventory: 'Inventory' as const,
  Main: 'Main' as const,
  Store: 'Store' as const,
  Trade: 'Trade' as const,
}

export const MENU_PAGE_ORDER: readonly MenuPage[] = [
  MENU_PAGE.Main,
  MENU_PAGE.Inventory,
  MENU_PAGE.Store,
  MENU_PAGE.Trade,
] as const

const initialState: MenuState = {
  open: true,
  page: MENU_PAGE.Main,
  transition: {
    direction: 'left',
    counter: 0,
  },
}

export const menuSlice = createProducer(initialState, {
  setMenuPage: (state, page: MenuPage, open = true, container?: string) => ({
    ...state,
    page,
    open,
    container,
    transition: {
      direction: getMenuDirection(state.page, page),
      counter: state.transition.counter + 1,
    },
  }),

  closeMenuPage: (state, page: MenuPage) => ({
    ...state,
    open: state.page === page ? false : state.open,
  }),

  setMenuOpen: (state, open: boolean) => ({
    ...state,
    open,
  }),
})

/**
 * Returns the direction of the transition from one menu page to
 * another. Used for animating navigation fluidly.
 */
export function getMenuDirection(from: MenuPage, to: MenuPage) {
  const fromIndex = MENU_PAGE_ORDER.indexOf(from)
  const toIndex = MENU_PAGE_ORDER.indexOf(to)
  if (fromIndex === -1 || toIndex === -1) {
    throw `Invalid menu page: ${from} -> ${to}`
  }
  return fromIndex < toIndex ? 'right' : 'left'
}
