import { Networking } from '@flamework/networking'
import {
  ClientHandler,
  ServerHandler,
} from '@flamework/networking/out/events/types'
import { BroadcastAction } from '@rbxts/reflex'
import { InventoryItemName } from 'ReplicatedStorage/shared/constants/core'
import { PlacementLocation } from 'ReplicatedStorage/shared/utils/placement'

interface ServerEvents {
  start: () => void
}

interface ServerFunctions {
  placeBlock: (itemName: InventoryItemName, location: PlacementLocation) => void
  breakBlock: (x: BasePart) => void
}

interface ClientEvents {
  dispatch: (actions: Array<BroadcastAction>) => void
  message: (
    messageType: string,
    message: string,
    emoji?: string,
    color?: Color3,
    colorSecondary?: Color3,
    duration?: number,
  ) => void
  start: () => void
}

interface ClientFunctions {}

export type ClientNetworkEvents = ClientHandler<ServerEvents, ClientEvents>

export type ServerNetworkEvents = ServerHandler<ClientEvents, ServerEvents>

export const GlobalEvents = Networking.createEvent<ServerEvents, ClientEvents>()

export const GlobalFunctions = Networking.createFunction<
  ServerFunctions,
  ClientFunctions
>()
