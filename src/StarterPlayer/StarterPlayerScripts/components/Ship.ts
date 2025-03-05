import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { ShipTag } from 'ReplicatedStorage/shared/constants/tags'
import { ShipController } from 'StarterPlayer/StarterPlayerScripts/controllers/ShipController'
import { createBulletAdjuster } from 'StarterPlayer/StarterPlayerScripts/utils/part'

@Component({ tag: ShipTag })
export class ShipComponent extends BaseComponent<{}, Ship> implements OnStart {
  config: ShipConfig = {
    gunsEnabled: false,
    speed: 120,
    turnSpeed: 10,
  }

  constructor(protected shipController: ShipController) {
    super()
  }

  onStart() {
    const ship = this.instance
    ship.Seat.GetPropertyChangedSignal('Occupant').Connect(() => {
      if (ship?.FindFirstChild<Seat>('Seat')?.Occupant)
        this.shipController.startShip(ship, this.config)
      else this.shipController.stopShip(ship)
    })

    if (ship.Guns) {
      for (const gun of [ship.Guns.Gun1, ship.Guns.Gun2]) {
        createBulletAdjuster(gun.Muzzle, gun)
      }
    }
  }
}
