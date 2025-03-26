import { hoarcekat } from '@rbxts/pretty-react-hooks'
import React from '@rbxts/react'
import { RootProvider } from 'StarterPlayer/StarterPlayerScripts/Gui/providers/RootProvider'
import { MainMenu } from 'StarterPlayer/StarterPlayerScripts/Gui/sections/Main'

export = hoarcekat(() => {
  return (
    <RootProvider>
      <MainMenu />
    </RootProvider>
  )
})
