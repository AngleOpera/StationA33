import React from '@rbxts/react'
import { ErrorHandler } from 'StarterPlayer/StarterPlayerScripts/Gui/components/ErrorHandler'
import { InventorySection } from 'StarterPlayer/StarterPlayerScripts/Gui/sections/Inventory'
import { MainMenu } from 'StarterPlayer/StarterPlayerScripts/Gui/sections/Main'
import { Music } from 'StarterPlayer/StarterPlayerScripts/Gui/sections/Music'

export function App() {
  return (
    <ErrorHandler>
      <Music />
      <screengui ResetOnSpawn={false}>
        <MainMenu />
        <InventorySection />
      </screengui>
    </ErrorHandler>
  )
}
