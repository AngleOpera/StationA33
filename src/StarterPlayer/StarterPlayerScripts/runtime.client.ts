import { Flamework, Modding } from '@flamework/core'
import Log, { Logger } from '@rbxts/log'

Log.SetLogger(Logger.configure().WriteTo(Log.RobloxOutput()).Create())
Modding.registerDependency<Logger>((ctor) => Log.ForContext(ctor))

Flamework.addPaths('src/StarterPlayer/StarterPlayerScripts/controllers')
Flamework.addPaths('src/StarterPlayer/StarterPlayerScripts/components')
Flamework.addPaths('src/ReplicatedStorage/shared/services')
Flamework.addPaths('src/ReplicatedStorage/shared/components')
Flamework.ignite()
