import { hoarcekat } from '@rbxts/pretty-react-hooks'
import React from '@rbxts/react'
import { RootProvider } from 'StarterPlayer/StarterPlayerScripts/Gui/providers/RootProvider'
import { InventoryMenu } from 'StarterPlayer/StarterPlayerScripts/Gui/sections/InventoryMenu'
import { store } from 'StarterPlayer/StarterPlayerScripts/store'
import { MENU_PAGE } from 'StarterPlayer/StarterPlayerScripts/store/MenuState'

export = hoarcekat(() => {
  store.setMenuPage(MENU_PAGE.Inventory)
  return (
    <RootProvider>
      <InventoryMenu />
    </RootProvider>
  )
})
