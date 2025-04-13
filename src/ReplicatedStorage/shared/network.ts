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
    plotId: string,
    midpoint: Vector3,
    rotation: Vector3,
  ) => void
  breakBlock: (plotId: string, voxel: Vector3, damage?: number) => void
  moveItem: (
    container: string,
    itemName: InventoryItemName,
    amount: number,
  ) => void
  spawnShip: (shipName: string) => void
}

interface ClientEvents {
  animate: (animation: string, path: string[]) => void
  animateBlock: (animation: string, plotId: string, voxel: Vector3) => void
  animateNewItem: (
    userId: number,
    itemType: number,
    encodedMidpoint: string,
    entityStep: [number, number],
  ) => void
  animateMoveItems: (entityStep: Array<[number, number]>) => void
  animateRemoveItems: (entity: number[]) => void
  dispatch: (actions: Array<BroadcastAction>) => void
  message: (type: string, content: MessageContent[], duration?: number) => void
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
