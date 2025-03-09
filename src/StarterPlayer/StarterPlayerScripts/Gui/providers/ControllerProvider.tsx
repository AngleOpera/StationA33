import React, { createContext, useMemo } from '@rbxts/react'
import { PlaceBlockController } from 'StarterPlayer/StarterPlayerScripts/controllers/PlaceBlockController'
import { PlayerController } from 'StarterPlayer/StarterPlayerScripts/controllers/PlayerController'

export interface ControllerContextData {
  placeBlockController?: PlaceBlockController
  playerController?: PlayerController
}

export interface ControllerProviderProps
  extends React.PropsWithChildren,
    ControllerContextData {}

export const ControllerContext = createContext<ControllerContextData>({})

export function ControllerProvider({
  children,
  placeBlockController,
  playerController,
}: ControllerProviderProps) {
  const data = useMemo(
    () => ({ placeBlockController, playerController }),
    [placeBlockController, playerController],
  )
  return (
    <ControllerContext.Provider value={data}>
      {children}
    </ControllerContext.Provider>
  )
}
