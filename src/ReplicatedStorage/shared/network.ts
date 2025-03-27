import { Networking } from '@flamework/networking'
import {
  ClientHandler,
  ServerHandler,
} from '@flamework/networking/out/events/types'
import { BroadcastAction } from '@rbxts/reflex'
import { InventoryItemName } from 'ReplicatedStorage/shared/constants/core'

interface ServerEvents {
  start: () => void
}

interface ServerFunctions {
  placeBlock: (
    itemName: InventoryItemName,
    midpoint: Vector3,
    rotation: Vector3,
  ) => void
  breakBlock: (midpoint: Vector3) => void
  moveItem: (
    container: string,
    itemName: InventoryItemName,
    amount: number,
  ) => void
}

interface ClientEvents {
  animate: (animation: string, path: string[]) => void
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
