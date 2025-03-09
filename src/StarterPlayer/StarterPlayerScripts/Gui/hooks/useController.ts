import { useContext } from '@rbxts/react'
import {
  ControllerContext,
  ControllerContextData,
} from 'StarterPlayer/StarterPlayerScripts/Gui/providers/ControllerProvider'

export function useController(): ControllerContextData {
  return useContext(ControllerContext)
}
