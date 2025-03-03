import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { ShipTag } from 'ReplicatedStorage/shared/constants/tags'
import { ShipController } from 'StarterPlayer/StarterPlayerScripts/controllers/ShipController'
import { createBulletAdjuster } from 'StarterPlayer/StarterPlayerScripts/utils/part'

@Component({ tag: ShipTag })
export class ShipComponent extends BaseComponent<{}, Ship> implements OnStart {
  config: ShipConfig = {
    gunsEnabled: true,
    speed: 120,
    turnSpeed: 10,
  }

  constructor(protected shipController: ShipController) {
    super()
  }

  onStart() {
    const plane = this.instance
    plane.Seat.GetPropertyChangedSignal('Occupant').Connect(() => {
      if (plane.Seat.Occupant) this.shipController.startShip(plane, this.config)
      else this.shipController.stopShip(plane)
    })

    if (plane.Guns) {
      for (const gun of [plane.Guns.Gun1, plane.Guns.Gun2]) {
        createBulletAdjuster(gun.Muzzle, gun)
      }
    }
  }
}
