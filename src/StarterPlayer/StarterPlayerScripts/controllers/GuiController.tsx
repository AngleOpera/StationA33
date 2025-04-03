import { Components } from '@flamework/components'
import { Controller, Dependency, OnStart } from '@flamework/core'
import React, { StrictMode } from '@rbxts/react'
import { createPortal, createRoot } from '@rbxts/react-roblox'
import { Players } from '@rbxts/services'
import { ShipSpawnerComponent } from 'StarterPlayer/StarterPlayerScripts/components/ShipSpawner'
import { PlaceBlockController } from 'StarterPlayer/StarterPlayerScripts/controllers/PlaceBlockController'
import { PlayerController } from 'StarterPlayer/StarterPlayerScripts/controllers/PlayerController'
import { App } from 'StarterPlayer/StarterPlayerScripts/Gui/pages/App'
import { RootProvider } from 'StarterPlayer/StarterPlayerScripts/Gui/providers/RootProvider'

@Controller({})
export class GuiController implements OnStart {
  playerGui = Players.LocalPlayer.WaitForChild('PlayerGui')
  root = createRoot(new Instance('Folder'))

  constructor(
    protected playerController: PlayerController,
    protected placeBlockController: PlaceBlockController,
  ) {}

  onStart() {
    const components = Dependency<Components>()
    components.onComponentRemoved<ShipSpawnerComponent>((shipSpawner) =>
      shipSpawner.onRemoved(),
    )

    this.root.render(
      createPortal(
        <StrictMode>
          <RootProvider
            placeBlockController={this.placeBlockController}
            playerController={this.playerController}
          >
            <App />
          </RootProvider>
        </StrictMode>,
        this.playerGui,
      ),
    )
  }
}
