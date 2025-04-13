import { Logger } from '@rbxts/log'
import { MESSAGE_TYPE } from 'ReplicatedStorage/shared/constants/core'
import { Events } from 'ServerScriptService/network'

export function logAndBroadcast(logger: Logger, message: string) {
  logger.Info(message)
  Events.message.broadcast('log', [{ value: message, type: MESSAGE_TYPE.text }])
}
