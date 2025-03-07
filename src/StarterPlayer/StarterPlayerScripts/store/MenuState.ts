import { createProducer } from '@rbxts/reflex'

export interface MenuState {
  readonly open: boolean
  readonly page: MenuPage
  readonly transition: {
    readonly direction: 'left' | 'right'
    readonly counter: number
  }
}

export type MenuPage = 'main' | 'store' | 'trade'

export const MENU_PAGES: readonly MenuPage[] = [
  'main',
  'store',
  'trade',
] as const

const initialState: MenuState = {
  open: true,
  page: 'main',
  transition: {
    direction: 'left',
    counter: 0,
  },
}

export const menuSlice = createProducer(initialState, {
  setMenuPage: (state, page: MenuPage) => ({
    ...state,
    page,
    transition: {
      direction: getMenuDirection(state.page, page),
      counter: state.transition.counter + 1,
    },
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
  const fromIndex = MENU_PAGES.indexOf(from)
  const toIndex = MENU_PAGES.indexOf(to)
  if (fromIndex === -1 || toIndex === -1) {
    throw `Invalid menu page: ${from} -> ${to}`
  }
  return fromIndex < toIndex ? 'right' : 'left'
}
