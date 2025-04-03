import { BaseComponent } from '@flamework/components'
import { OnStart, Service } from '@flamework/core'
import { Logger } from '@rbxts/log'
import { ReplicatedStorage } from '@rbxts/services'
import { findDescendentsWhichAre } from 'ReplicatedStorage/shared/utils/instance'
import { weldParts } from 'ReplicatedStorage/shared/utils/part'
import { Functions } from 'ServerScriptService/network'
import { PlayerService } from 'ServerScriptService/services/PlayerService'

@Service()
export class VehicleSpawnerService
  extends BaseComponent<{}, ShipSpawner>
  implements OnStart
{
  constructor(
    protected readonly playerService: PlayerService,
    protected readonly logger: Logger,
  ) {
    super()
  }

  onStart() {
    Functions.spawnShip.setCallback((player, shipName) => {
      try {
        this.handleSpawnShip(player, shipName)
      } catch (e) {
        this.logger.Error(`VehicleSpawnerService.spawnShip: ${e}`)
      }
    })
  }

  handleSpawnShip(player: Player, shipName: string) {
    const template = ReplicatedStorage.Ships.FindFirstChild<Ship>(shipName)
    if (!template) {
      this.logger.Warn(`VehicleSpawnerService.spawnShip: ${shipName} not found`)
      return
    }

    // Destroy any existing ships
    const playerSpace = this.playerService.getPlayerSpace(player)
    const ships = playerSpace.Ships
    for (const ship of ships.GetChildren()) ship.Destroy()

    // Clone the ship template
    const ship = template.Clone()
    ship.PrimaryPart = ship.Body
    weldParts(findDescendentsWhichAre<BasePart>(ship, 'BasePart'), ship.Body)

    const pad = playerSpace.Plot.Pad
    ship.PivotTo(
      pad
        .GetPivot()
        .ToWorldSpace(
          new CFrame(new Vector3(30, pad.GetBoundingBox()[1].Y / 2, 0)),
        ),
    )

    ship.Parent = ships
  }
}
