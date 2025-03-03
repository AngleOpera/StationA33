import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { Players } from '@rbxts/services'
import { ShipTag } from 'ReplicatedStorage/shared/constants/tags'
import { createBullet } from 'ServerScriptService/utils/part'

@Component({ tag: ShipTag })
export class ShipComponent extends BaseComponent<{}, Ship> implements OnStart {
  onStart() {
    const plane = this.instance
    const seat = plane.Seat

    if (plane.FindFirstChild('Guns')) {
      plane.Shoot.OnServerEvent.Connect((_player) => {
        if (!seat.Occupant?.Parent) return
        for (const gun of [plane.Guns.Gun1, plane.Guns.Gun2]) {
          createBullet(
            gun.Muzzle,
            gun,
            Players.GetPlayerFromCharacter(seat.Occupant.Parent),
            [plane, seat.Occupant.Parent],
          )
        }
      })
    }

    seat.GetPropertyChangedSignal('Occupant').Connect(() => {
      if (seat.Occupant) {
        this.startEngine(true)
        const player = Players.GetPlayerFromCharacter(seat.Occupant.Parent)
        if (player) plane.Body.SetNetworkOwner(player)
      } else {
        this.startEngine(false)
      }
    })
  }

  startEngine(_on: boolean) {}
}
