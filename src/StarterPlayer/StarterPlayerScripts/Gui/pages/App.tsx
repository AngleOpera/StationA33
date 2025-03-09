import React from '@rbxts/react'
import { ErrorHandler } from 'StarterPlayer/StarterPlayerScripts/Gui/components/ErrorHandler'
import { InventoryMenu } from 'StarterPlayer/StarterPlayerScripts/Gui/sections/InventoryMenu'
import { MainMenu } from 'StarterPlayer/StarterPlayerScripts/Gui/sections/MainMenu'
import { Music } from 'StarterPlayer/StarterPlayerScripts/Gui/sections/Music'

export function App() {
  return (
    <ErrorHandler>
      <Music />
      <screengui>
        <MainMenu />
        <InventoryMenu />
      </screengui>
    </ErrorHandler>
  )
}
