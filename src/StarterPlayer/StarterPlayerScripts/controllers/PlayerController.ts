import { Controller, OnStart } from '@flamework/core'
import { CmdrClient } from '@rbxts/cmdr'
import { DeviceType } from '@rbxts/device'
import { Logger } from '@rbxts/log'
import {
  Players,
  RunService,
  UserInputService,
  Workspace,
} from '@rbxts/services'
import { USER_DEVICE } from 'ReplicatedStorage/shared/constants/core'
import { ShooterComponent } from 'StarterPlayer/StarterPlayerScripts/components/Shooter'

@Controller({})
export class PlayerController implements OnStart {
  firstRespawn = true
  collectionAnimationPlaying = false
  playerSpace: PlayerSpace | undefined
  shooter: ShooterComponent | undefined
  isDesktop = USER_DEVICE === DeviceType.Desktop
  isSeated = false
  isShooting = false
  runSpeed = 32
  walkSpeed = 16

  constructor(protected logger: Logger) {}

  onStart() {
    CmdrClient.SetActivationKeys([Enum.KeyCode.F2])

    const player = Players.LocalPlayer

    this.startInputHandling()
    this.startMyRespawnHandler(player)
  }

  getPlayerSpace() {
    if (this.playerSpace) return this.playerSpace
    const key = `${Players.LocalPlayer.UserId}`
    const playerSpace = Workspace.PlayerSpaces.WaitForChild<PlayerSpace>(key)
    if (!playerSpace) throw 'Player space not found'
    this.playerSpace = playerSpace
    return playerSpace
  }

  equipShooter(shooter: ShooterComponent | undefined) {
    this.shooter = shooter
    this.isShooting = false
  }

  startInputHandling() {
    UserInputService.InputBegan.Connect((inputObject, gameHandledEvent) => {
      if (inputObject.KeyCode === Enum.KeyCode.LeftShift) {
        // Sprint started
        const player = Players.LocalPlayer
        const humanoid = (player.Character as PlayerCharacter)?.Humanoid
        const camera = game.Workspace.CurrentCamera
        if (humanoid && humanoid.WalkSpeed > 0)
          humanoid.WalkSpeed = this.runSpeed
        if (camera) camera.FieldOfView = 60
      } else if (
        inputObject.UserInputType === Enum.UserInputType.MouseButton1 &&
        this.shooter &&
        !gameHandledEvent
      ) {
        this.isShooting = true
      }
    })

    UserInputService.InputEnded.Connect((inputObject, gameHandledEvent) => {
      if (inputObject.KeyCode === Enum.KeyCode.LeftShift) {
        // Sprint stopped
        const player = Players.LocalPlayer
        const humanoid = (player.Character as PlayerCharacter)?.Humanoid
        const camera = game.Workspace.CurrentCamera
        if (humanoid && humanoid.WalkSpeed > 0)
          humanoid.WalkSpeed = this.walkSpeed
        if (camera) camera.FieldOfView = 70
      } else if (
        inputObject.UserInputType === Enum.UserInputType.MouseButton1 &&
        this.shooter &&
        !gameHandledEvent
      ) {
        this.isShooting = false
      }
    })

    RunService.Stepped.Connect(() => {
      if (this.isShooting && this.shooter && this.shooter.mouse) {
        this.shooter.instance.MouseEvent.FireServer(
          this.shooter.mouse.Hit.Position,
        )
      }
    })
  }

  startMyRespawnHandler(player: Player) {
    player.CharacterAdded.Connect((character) =>
      this.handleRespawn(player, character),
    )
    if (player.Character) this.handleRespawn(player, player.Character)
  }

  handleRespawn(_player: Player, _playerCharacter: Model) {
    if (this.firstRespawn) {
      this.firstRespawn = false
    }
  }

  handleLoaded(_player: Player) {}
}
