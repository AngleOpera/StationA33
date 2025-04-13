import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { Logger } from '@rbxts/log'
import RaycastHitbox, { HitboxObject } from '@rbxts/raycast-hitbox'
import { CollectionService, Players, Workspace } from '@rbxts/services'
import {
  ANIMATIONS,
  IS_CLIENT,
  IS_SERVER,
} from 'ReplicatedStorage/shared/constants/core'
import { Swing, SWINGS_LOOKUP } from 'ReplicatedStorage/shared/constants/swings'
import { SwingerTag } from 'ReplicatedStorage/shared/constants/tags'
import { ServerNetworkEvents } from 'ReplicatedStorage/shared/network'
import { SharedStore } from 'ReplicatedStorage/shared/state'
import { createAnimation } from 'ReplicatedStorage/shared/utils/animation'
import { getItemFromBlock } from 'ReplicatedStorage/shared/utils/core'
import {
  takeBlockDamage,
  takeDamage,
} from 'ReplicatedStorage/shared/utils/damage'
import { findPathToDescendent } from 'ReplicatedStorage/shared/utils/instance'
import { isSameTeam } from 'ReplicatedStorage/shared/utils/player'

@Component({ tag: SwingerTag })
export class SwingerComponent
  extends BaseComponent<SwingerAttributes, Swinger>
  implements OnStart
{
  serverEvents: ServerNetworkEvents | undefined
  serverStore: SharedStore | undefined
  character: PlayerCharacter | undefined
  player: Player | undefined
  humanoid: Humanoid | undefined
  torso: BasePart | undefined
  hitbox: HitboxObject | undefined
  sheathSound: Sound | undefined
  unsheathSound: Sound | undefined
  swing: Swing | undefined
  active: Swing | undefined
  debounce = new Set<string>()
  equipped = false

  constructor(private readonly logger: Logger) {
    super()
    if (IS_SERVER) {
      const { Events } = import('ServerScriptService/network').expect()
      const { store } = import('ServerScriptService/store').expect()
      this.serverEvents = Events
      this.serverStore = store
    }
  }

  onStart() {
    const tool = this.instance
    const handle = tool.Handle

    this.character = tool.Parent as PlayerCharacter | undefined
    this.sheathSound = handle.FindFirstChild<Sound>('Sheath')
    this.unsheathSound = handle.FindFirstChild<Sound>('Unsheath')
    if (this.attributes.SwingName) {
      this.swing = SWINGS_LOOKUP[this.attributes.SwingName]
    }

    tool.Enabled = true
    tool.Activated.Connect(() => this.handleActivated())
    tool.Equipped.Connect(() => this.handleEquipped())
    tool.Unequipped.Connect(() => this.handleUnequipped())
  }

  getSwing(): Swing | undefined {
    const swing = this.swing
    if (!swing) return undefined
    if (IS_SERVER) {
      if (swing.soundName && !swing.sound) {
        swing.sound = this.instance.Handle.WaitForChild<Sound>(swing.soundName)
      }
    } else {
      if (swing.r15animationId && !swing.r15animation) {
        const swingName = `R15${swing.name}`
        swing.r15animation =
          this.instance.FindFirstChild<Animation>(swingName) ||
          createAnimation(swingName, swing.r15animationId, this.instance)
      }
    }
    return swing
  }

  isAlive() {
    return (
      (this.player &&
        this.player.Parent &&
        this.character &&
        this.character.Parent &&
        this.humanoid &&
        this.humanoid.Parent &&
        this.humanoid.Health > 0 &&
        this.torso &&
        this.torso.Parent &&
        true) ||
      false
    )
  }

  handleEquipped() {
    this.character = this.instance.Parent as PlayerCharacter | undefined
    if (!this.character) return

    this.player = Players.GetPlayerFromCharacter(this.character)
    this.humanoid = this.character.FindFirstChildOfClass('Humanoid')
    this.torso =
      this.character.FindFirstChild<BasePart>('Torso') ||
      this.character.FindFirstChild<BasePart>('HumanoidRootPart')
    if (!this.isAlive()) return

    this.equipped = true
    if (IS_SERVER) {
      this.hitbox = new RaycastHitbox(this.instance)
      this.hitbox.DetectionMode = RaycastHitbox.DetectionMode.PartMode
      this.hitbox.Visualizer = false
      this.hitbox.OnHit.Connect((hit) => this.handleStruckTarget(hit))
      this.sheathSound?.Stop()
      this.unsheathSound?.Play()
    }
  }

  handleUnequipped() {
    this.hitbox?.Destroy()
    this.hitbox = undefined
    this.equipped = false
    if (IS_SERVER) {
      this.unsheathSound?.Stop()
      this.sheathSound?.Play()
      this.swing?.sound?.Stop()
    }
  }

  handleActivated() {
    if (
      !this.instance.Enabled ||
      !this.equipped ||
      !this.humanoid ||
      !this.torso ||
      !this.isAlive()
    )
      return

    const swing = this.getSwing()
    if (!swing || (!swing?.r15animation && IS_CLIENT)) return

    this.active = swing
    this.debounce.clear()
    this.instance.Enabled = false
    if (IS_SERVER) {
      this.hitbox?.HitStart()
      swing.sound?.Play()
    }
    if (swing.r15animation) {
      const track = this.humanoid.LoadAnimation(swing.r15animation)
      track.Play(0)
    }
    if (IS_SERVER) {
      wait(swing.duration)
      this.hitbox?.HitStop()
    }
    this.active = undefined
    this.instance.Enabled = true
  }

  handleStruckTarget(hit: Instance) {
    if (
      !hit ||
      !hit.Parent ||
      !this.active ||
      !this.player ||
      !this.equipped ||
      !this.isAlive()
    )
      return

    const rightArm =
      this.character?.FindFirstChild('Right Arm') ||
      this.character?.FindFirstChild('RightHand')
    if (!rightArm) return
    const rightGrip = rightArm.FindFirstChild<Weld>('RightGrip')
    if (
      !rightGrip ||
      (rightGrip.Part0 !== this.instance.Handle &&
        rightGrip.Part1 !== this.instance.Handle)
    )
      return

    const hitParent = hit.Parent
    if (hitParent === this.character) return
    if (hitParent.IsA('Model')) {
      if (CollectionService.HasTag(hitParent, 'Minable')) {
        const fullName = hitParent.GetFullName()
        if (this.debounce.has(fullName)) return
        this.debounce.add(fullName)

        this.handleStruckMinable(hitParent)
        return
      }
      if (hitParent?.Parent?.Name === 'PlacedBlocks') {
        this.handleStruckBlock(hitParent)
        return
      }
    }

    const humanoid = hitParent.FindFirstChildOfClass('Humanoid')
    if (!humanoid || humanoid.Health === 0) return

    const player = Players.GetPlayerFromCharacter(hitParent)
    if (player) {
      if (player === this.player || isSameTeam(this.player, player)) return
      this.handleStruckPlayer(player, humanoid)
      return
    }
  }

  handleStruckBlock(_block: Model) {
    /*
    const item = getItemFromBlock(block)
    if (!item) return
    this.logger.Info(
      `${this.character?.Name} strikes ${block.Name} for ${this.active?.baseDamage} damage`,
    )
    const path = findPathToDescendent(Workspace, block)
    if (path && this.serverEvents)
      this.serverEvents.animate.broadcast(ANIMATIONS.BreakBlock, path)
    */
  }

  handleStruckMinable(minable: Model) {
    const item = getItemFromBlock(minable)
    if (!item) return
    this.logger.Info(
      `${this.character?.Name} strikes ${minable.Name} for ${this.active?.baseDamage} damage`,
    )
    const path = findPathToDescendent(Workspace, minable)
    if (path && this.serverEvents)
      this.serverEvents.animate.broadcast(ANIMATIONS.BreakBlock, path)
    if (this.player && this.serverStore)
      takeBlockDamage(
        minable,
        1,
        item,
        this.serverStore,
        this.serverEvents,
        this.player,
      )
  }

  handleStruckPlayer(player: Player, humanoid: Humanoid) {
    const damage = this.active?.baseDamage
    if (!damage || !this.player) return
    this.logger.Info(
      `${this.character?.Name} strikes ${player.Name} with ${this.active?.name} for ${damage} damage`,
    )
    takeDamage(humanoid, damage, this.player.UserId)
  }
}
