import React from '@rbxts/react'
import { ErrorHandler } from 'StarterPlayer/StarterPlayerScripts/Gui/components/ErrorHandler'
import { GameLog } from 'StarterPlayer/StarterPlayerScripts/Gui/sections/GameLog'
import { InventorySection } from 'StarterPlayer/StarterPlayerScripts/Gui/sections/Inventory'
import { MainMenu } from 'StarterPlayer/StarterPlayerScripts/Gui/sections/Main'
import { Music } from 'StarterPlayer/StarterPlayerScripts/Gui/sections/Music'

export function App() {
  return (
    <ErrorHandler>
      <screengui ResetOnSpawn={false}>
        <Music />
        <MainMenu />
        <InventorySection />
        <GameLog />
      </screengui>
    </ErrorHandler>
  )
}
