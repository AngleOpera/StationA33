import React from '@rbxts/react'
import { ReflexProvider } from '@rbxts/react-reflex'
import {
  ControllerProvider,
  ControllerProviderProps,
} from 'StarterPlayer/StarterPlayerScripts/Gui/providers/ControllerProvider'
import {
  RemProvider,
  RemProviderProps,
} from 'StarterPlayer/StarterPlayerScripts/Gui/providers/RemProvider'
import { store } from 'StarterPlayer/StarterPlayerScripts/store'

interface RootProviderProps extends ControllerProviderProps, RemProviderProps {}

export function RootProvider({
  baseRem,
  children,
  placeBlockController,
  playerController,
  remOverride,
}: RootProviderProps) {
  return (
    <ReflexProvider producer={store}>
      <ControllerProvider
        placeBlockController={placeBlockController}
        playerController={playerController}
      >
        <RemProvider baseRem={baseRem} remOverride={remOverride}>
          {children}
        </RemProvider>
      </ControllerProvider>
    </ReflexProvider>
  )
}
