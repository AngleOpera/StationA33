import { OnInit, Service } from '@flamework/core'
import { Logger } from '@rbxts/log'
import ProfileService from '@rbxts/profileservice'
import { Profile } from '@rbxts/profileservice/globals'
import { Players, ReplicatedStorage, Workspace } from '@rbxts/services'
import {
  PLACE_PLOT_LOCATION,
  PROFILESTORE_NAME,
  PROFILESTORE_USER_TEMPLATE,
} from 'ReplicatedStorage/shared/constants/core'
import { selectPlayerState } from 'ReplicatedStorage/shared/state'
import {
  defaultPlayerData,
  getPlayerData,
  PlayerData,
  PlayerState,
} from 'ReplicatedStorage/shared/state/PlayersState'
import {
  findDescendentsWhichAre,
  weldParts,
  weldTool,
} from 'ReplicatedStorage/shared/utils/instance'
import { MeshMap } from 'ReplicatedStorage/shared/utils/mesh'
import { Events } from 'ServerScriptService/network'
import { LeaderboardService } from 'ServerScriptService/services/LeaderboardService'
import { MeshService } from 'ServerScriptService/services/MeshService'
import { TransactionService } from 'ServerScriptService/services/TransactionService'
import { store } from 'ServerScriptService/store'
import {
  forEveryPlayer,
  getAttackerUserId,
} from 'ServerScriptService/utils/player'

export interface PlayerProfile {
  data: PlayerData
  mesh: Partial<Record<PlotLocation, MeshMap>>
}

export interface PlayerContext {
  player: Player
  cleanup: Array<() => void>
  profile?: Profile<PlayerProfile>
}

@Service()
export class PlayerService implements OnInit {
  private players = new Map<number, PlayerContext>()
  private profileStore = ProfileService.GetProfileStore(PROFILESTORE_NAME, {
    data: defaultPlayerData,
    mesh: { [PLACE_PLOT_LOCATION]: {} },
  })

  constructor(
    protected readonly logger: Logger,
    protected readonly placeBlockService: MeshService,
    protected readonly leaderboardService: LeaderboardService,
    protected readonly transactionService: TransactionService,
  ) {}

  onInit() {
    forEveryPlayer(
      (player) => this.handlePlayerJoined(player),
      (player) => this.handlePlayerLeft(player),
    )
  }

  private handlePlayerLeft(player: Player) {
    this.logger.Info(`Player ${player.UserId} left`)
    const playerContext = this.players.get(player.UserId)
    if (playerContext?.profile?.Data)
      this.leaderboardService.updateDatastoresForPlayer(
        player,
        playerContext.profile.Data.data,
      )
    const cleanup = playerContext?.cleanup
    if (cleanup) {
      playerContext.cleanup = []
      for (const unsubscribe of cleanup) unsubscribe()
    }
    playerContext?.profile?.Release()
    store.closePlayerData(player.UserId)
    this.players.delete(player.UserId)
    this.placeBlockService.loadPlayerSandbox(player, undefined)
    this.cleanupPlayerSpace(player)
  }

  private handlePlayerJoined(player: Player) {
    this.logger.Info(`Player ${player.UserId} joined`)

    // Setup player context
    const playerContext: PlayerContext = {
      player,
      cleanup: [],
    }
    this.players.set(player.UserId, playerContext)

    // Assign plot before the player spawns
    const playerSelector = selectPlayerState(player.UserId)
    let state = store.loadPlayerData(player.UserId, player.Name)
    let playerState = playerSelector(state)
    if (!playerState) {
      player.Kick()
      return
    }
    this.cleanupPlayerSpace(player)
    const playerSpace = this.createPlayerSpace(player, playerState)
    player.RespawnLocation = playerSpace.Plot.SpawnLocation

    // Load player data from ProfileService
    const profileKey = PROFILESTORE_USER_TEMPLATE.format(player.UserId)
    if (playerContext.profile) playerContext.profile.Release()
    playerContext.profile = this.profileStore.LoadProfileAsync(profileKey)
    if (!playerContext.profile) {
      player.Kick()
      return
    }
    playerContext.profile.AddUserId(player.UserId)
    playerContext.profile.Reconcile()
    playerContext.profile.ListenToRelease(() => {
      this.logger.Info(`Releasing profile ${player.UserId}`)
      player.Kick()
    })
    if (!player.IsDescendantOf(Players)) {
      player.Kick()
      return
    }
    this.logger.Info(
      `Loaded player ${player.UserId} data {@ProfileData}`,
      playerContext.profile.Data.data,
    )

    // Update reflex state with player data
    state = store.loadPlayerData(
      player.UserId,
      player.Name,
      playerContext.profile.Data.data,
    )
    playerState = playerSelector(state)
    if (!playerState) throw 'PlayerState not found'
    this.logger.Info(`Player state loaded`, playerState)

    // Load player's placed blocks
    this.logger.Info(
      `Loaded player ${player.UserId} data {@MeshData}`,
      playerContext.profile.Data.mesh,
    )
    this.placeBlockService.loadPlayerSandbox(player, {
      location: PLACE_PLOT_LOCATION,
      mesh: playerContext.profile.Data.mesh,
      workspace: playerSpace,
    })

    // Load player's game passes
    Promise.try(() =>
      this.transactionService.reloadPlayerGamePasses(player, player.UserId),
    )

    // Update ProfileService with changes to player state
    playerContext.cleanup.push(
      store.subscribe(playerSelector, (playerState, previousPlayerState) => {
        if (!playerState || !playerContext.profile) return
        playerContext.profile.Data.data = getPlayerData(playerState)
        if (!previousPlayerState) return
      }),
    )

    // Update leaderstats with changes to player state
    playerContext.cleanup.push(
      this.createLeaderstatsHandler(player, playerState),
    )

    this.createRespawnHandler(player)
  }

  private createLeaderstatsHandler(player: Player, playerState?: PlayerState) {
    const leaderstats = new Instance('Folder')
    leaderstats.Name = 'leaderstats'
    leaderstats.Parent = player

    const credits = new Instance('IntValue')
    credits.Name = `Credits`
    credits.Value = playerState?.credits ?? 0
    credits.Parent = leaderstats

    const unsubscribe = store.subscribe(
      selectPlayerState(player.UserId),
      (playerData) => {
        credits.Value = playerData?.credits ?? 0
      },
    )
    return unsubscribe
  }

  private createRespawnHandler(player: Player) {
    if (player.Character)
      task.defer(() =>
        this.handleRespawn(player, player.Character as PlayerCharacter),
      )
    player.CharacterAdded.Connect((characterModel) =>
      this.handleRespawn(player, characterModel as PlayerCharacter),
    )
  }

  public handleRespawn(player: Player, characterModel: PlayerCharacter) {
    const humanoid = characterModel.Humanoid
    humanoid.Died.Connect(() =>
      this.handleKO(humanoid, player.UserId, player.Name),
    )

    const backpack = player?.FindFirstChild<Backpack>('Backpack')
    if (backpack) {
      ReplicatedStorage.Tools.PickAxe.Clone().Parent = backpack
      weldTool(ReplicatedStorage.Tools.PlaceBlock.Clone()).Parent = backpack
      weldTool(ReplicatedStorage.Tools.BreakBlock.Clone()).Parent = backpack
    }
  }

  public handleKO(
    humanoid: Humanoid,
    _playerUserId: number,
    playerName: string,
  ) {
    const attackerUserId = getAttackerUserId(humanoid)
    let message
    if (attackerUserId) {
      message = `${playerName} was KO'd by ${Players.GetPlayerByUserId(attackerUserId)?.Name}`
    } else if ((humanoid.RootPart?.Position?.Y ?? 0) < -30) {
      message = `${playerName} fell to their doom`
    } else {
      message = `${playerName} was KO'd`
    }
    Events.message.broadcast('log', message)
  }

  public getPlayerSpace(player: Player): PlayerSpace {
    const key = `${player.UserId}`
    const existing = Workspace.PlayerSpaces.FindFirstChild(key)
    if (!existing) throw 'PlayerSpace not found'
    return existing as PlayerSpace
  }

  public createPlayerSpace(
    player: Player,
    playerState: PlayerState,
  ): PlayerSpace {
    const key = `${player.UserId}`
    const folder = new Instance('Folder')
    folder.Name = key

    const placedBlocks = new Instance('Model')
    placedBlocks.Name = 'PlacedBlocks'
    placedBlocks.Parent = folder

    const placeBlockPreview = new Instance('Model')
    placeBlockPreview.Name = 'PlaceBlockPreview'
    placeBlockPreview.Parent = folder

    const plot = ReplicatedStorage.Common.Plot.Clone()
    this.setupPlot(plot, player, playerState)
    plot.Parent = folder

    const ships = new Instance('Folder')
    ships.Name = 'Ships'
    const ship = ReplicatedStorage.Ships.OlReliable.Clone()
    ship.Parent = ships
    this.setupShip(ship, player, playerState)
    ships.Parent = folder

    folder.Parent = Workspace.PlayerSpaces
    return folder as PlayerSpace
  }

  private cleanupPlayerSpace(player: Player) {
    const key = `${player.UserId}`
    const existing = Workspace.PlayerSpaces.FindFirstChild(key)
    if (existing) existing.Destroy()
  }

  public setupPlot(plot: Plot, _player: Player, playerState: PlayerState) {
    plot.PrimaryPart = plot.Baseplate
    plot.PivotTo(Workspace.Planet[playerState.plotName].CFrame)
  }

  public setupShip(ship: Ship, _player: Player, playerState: PlayerState) {
    ship.PrimaryPart = ship.Body
    weldParts(findDescendentsWhichAre<BasePart>(ship, 'BasePart'), ship.Body)
    ship.PivotTo(Workspace.Planet[playerState.plotName].CFrame)
  }
}
