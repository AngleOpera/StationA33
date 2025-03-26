import { hoarcekat } from '@rbxts/pretty-react-hooks'
import React from '@rbxts/react'
import { RootProvider } from 'StarterPlayer/StarterPlayerScripts/Gui/providers/RootProvider'
import { InventorySection } from 'StarterPlayer/StarterPlayerScripts/Gui/sections/Inventory'
import { store } from 'StarterPlayer/StarterPlayerScripts/store'
import { MENU_PAGE } from 'StarterPlayer/StarterPlayerScripts/store/MenuState'

export = hoarcekat(() => {
  store.setMenuPage(MENU_PAGE.Inventory, true, 'foobar')
  return (
    <RootProvider>
      <InventorySection />
    </RootProvider>
  )
})
