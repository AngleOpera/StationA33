import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { Logger } from '@rbxts/log'
import Object from '@rbxts/object-utils'
import RaycastHitbox, { HitboxObject } from '@rbxts/raycast-hitbox'
import { Players } from '@rbxts/services'
import { SwingerTag } from 'ReplicatedStorage/shared/constants/tags'
import { createAnimation } from 'ReplicatedStorage/shared/utils/instance'
// import { isSameTeam, takeDamage } from 'ServerScriptService/utils/player'

export interface Swing {
  name: string
  baseDamage?: number
  r15animation?: Animation
  r15animationId: number
  soundName?: string
  sound?: Sound
}

@Component({ tag: SwingerTag })
export class SwingerComponent
  extends BaseComponent<SwingerAttributes, Swinger>
  implements OnStart
{
  swings: Record<string, Swing> = {}
  character: PlayerCharacter | undefined
  player: Player | undefined
  humanoid: Humanoid | undefined
  torso: BasePart | undefined
  hitbox: HitboxObject | undefined
  sheathSound: Sound | undefined
  unsheathSound: Sound | undefined
  active: Swing | undefined
  equipped = false

  constructor(private readonly logger: Logger) {
    super()
  }

  onStart() {
    const tool = this.instance
    const handle = tool.Handle

    this.character = tool.Parent as PlayerCharacter | undefined
    this.sheathSound = handle.FindFirstChild<Sound>('Sheath')
    this.unsheathSound = handle.FindFirstChild<Sound>('Unsheath')

    if (this.attributes.AnimationId) {
      this.swings.Default = {
        name: 'Default',
        baseDamage: 0,
        r15animationId: this.attributes.AnimationId,
      }
    }

    for (const swing of Object.values(this.swings)) {
      if (swing.r15animationId && !swing.r15animation) {
        const swingName = `R15${swing.name}`
        swing.r15animation =
          this.instance.FindFirstChild<Animation>(swingName) ||
          createAnimation(swingName, swing.r15animationId, this.instance)
      }
      if (swing.soundName && !swing.sound) {
        swing.sound = handle.WaitForChild<Sound>(swing.soundName)
      }
    }

    tool.Enabled = true
    tool.Activated.Connect(() => this.handleActivated())
    tool.Equipped.Connect(() => this.handleEquipped())
    tool.Unequipped.Connect(() => this.handleUnequipped())
  }

  getSwing(): Swing | undefined {
    return this.swings.Default
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
    this.hitbox = new RaycastHitbox(this.instance)
    this.hitbox.DetectionMode = RaycastHitbox.DetectionMode.PartMode
    this.hitbox.Visualizer = true
    this.hitbox.OnHit.Connect((hit) => this.handleStruckTarget(hit))
    this.sheathSound?.Stop()
    this.unsheathSound?.Play()
  }

  handleUnequipped() {
    this.hitbox?.Destroy()
    this.equipped = false
    this.unsheathSound?.Stop()
    this.sheathSound?.Play()
    for (const swing of Object.values(this.swings)) swing.sound?.Stop()
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
    if (!swing?.r15animation) return

    this.active = swing
    this.instance.Enabled = false
    this.hitbox?.HitStart()
    swing.sound?.Play()
    const track = this.humanoid.LoadAnimation(swing.r15animation)
    track.Play(0)
    this.hitbox?.HitStop()
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

    const character = hit.Parent
    if (character === this.character) return
    const humanoid = character.FindFirstChildOfClass('Humanoid')
    if (!humanoid || humanoid.Health === 0) return
    /*
    const player = Players.GetPlayerFromCharacter(character)

    if (player && (player === this.player || isSameTeam(this.player, player)))
      return

    const damage = this.active.baseDamage
    if (!damage) return
    this.logger.Info(
      `${this.character?.Name} strikes ${hit.Parent?.Name} with ${this.active.name} for ${damage} damage`,
    )
    takeDamage(humanoid, damage, this.player.UserId)
    */
  }
}
