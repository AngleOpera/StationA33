import { OnInit, Service } from '@flamework/core'
import { Logger } from '@rbxts/log'
import ProfileService from '@rbxts/profileservice'
import { Profile } from '@rbxts/profileservice/globals'
import {
  HttpService,
  Players,
  ReplicatedStorage,
  Workspace,
} from '@rbxts/services'
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
import { PlaceBlockService } from 'ServerScriptService/services/PlaceBlockService'
import { TransactionService } from 'ServerScriptService/services/TransactionService'
import { store } from 'ServerScriptService/store'
import {
  forEveryPlayer,
  getAttackerUserId,
} from 'ServerScriptService/utils/player'

export interface PlayerProfile {
  data: PlayerData
  mesh: Record<PlotLocation, MeshMap>
}

@Service()
export class PlayerService implements OnInit {
  private profiles = new Map<number, Profile<PlayerProfile>>()
  private profileStore = ProfileService.GetProfileStore(PROFILESTORE_NAME, {
    data: defaultPlayerData,
    mesh: { [PLACE_PLOT_LOCATION]: {} },
  })

  constructor(
    protected readonly logger: Logger,
    protected readonly placeBlockService: PlaceBlockService,
    protected readonly leaderboardService: LeaderboardService,
    protected readonly transactionService: TransactionService,
  ) {}

  onInit() {
    forEveryPlayer(
      (player) => this.handlePlayerJoined(player),
      (player) => this.handlePlayerLeft(player),
    )
  }

  public getProfile(player: Player) {
    return this.profiles.get(player.UserId)
  }

  private handlePlayerLeft(player: Player) {
    this.cleanupPlayerSpace(player)
    const profile = this.profiles.get(player.UserId)
    if (profile?.Data)
      this.leaderboardService.updateDatastoresForPlayer(
        player,
        profile.Data.data,
      )
    this.logger.Info(`Player left ${player.UserId}`)
    profile?.Release()
  }

  private handlePlayerJoined(player: Player) {
    this.logger.Info(`Player joined ${player.UserId}`)
    const profileKey = PROFILESTORE_USER_TEMPLATE.format(player.UserId)
    const profile = this.profileStore.LoadProfileAsync(profileKey)
    if (!profile) return player.Kick()

    profile.AddUserId(player.UserId)
    profile.Reconcile()
    profile.ListenToRelease(() => {
      this.logger.Info(`Releasing profile ${player.UserId}`)
      this.profiles.delete(player.UserId)
      store.closePlayerData(player.UserId)
      player.Kick()
    })

    if (!player.IsDescendantOf(Players)) {
      profile.Release()
      return
    }

    this.logger.Info(
      `Player loaded ${player.UserId}: ${HttpService.JSONEncode(profile.Data.data)}`,
    )
    this.profiles.set(player.UserId, profile)
    const state = store.loadPlayerData(
      player.UserId,
      player.Name,
      profile.Data.data,
    )
    const playerSelector = selectPlayerState(player.UserId)
    const playerState = playerSelector(state)
    if (!playerState) throw 'PlayerState not found'
    this.logger.Info(`Player state loaded`, playerState)

    this.cleanupPlayerSpace(player)
    const playerSpace = this.createPlayerSpace(player, playerState)
    player.RespawnLocation = playerSpace.Plot.SpawnLocation

    this.logger.Info(
      `loaded mesh data: ${HttpService.JSONEncode(profile.Data.mesh)}`,
    )
    this.placeBlockService.loadPlayerSandbox(player, {
      location: PLACE_PLOT_LOCATION,
      mesh: profile.Data.mesh,
      workspace: playerSpace,
    })
    Promise.try(() =>
      this.transactionService.reloadPlayerGamePasses(player, player.UserId),
    )

    const unsubscribePlayerData = store.subscribe(
      playerSelector,
      (playerState, previousPlayerState) => {
        if (!playerState) return
        profile.Data.data = getPlayerData(playerState)
        if (!previousPlayerState) return
      },
    )

    const unsubscribeLeaderstats = this.createLeaderstatsHandler(
      player,
      playerState,
    )

    Players.PlayerRemoving.Connect((playerLeft) => {
      if (playerLeft.UserId !== player.UserId) return
      unsubscribePlayerData()
      unsubscribeLeaderstats()
      this.placeBlockService.loadPlayerSandbox(player, undefined)
    })

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
    const humanoid = (characterModel as PlayerCharacter).Humanoid
    humanoid.Died.Connect(() =>
      this.handleKO(humanoid, player.UserId, player.Name),
    )

    const backpack = player?.FindFirstChild<Backpack>('Backpack')
    if (backpack) {
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
