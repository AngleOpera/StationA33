import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import React, { StrictMode } from '@rbxts/react'
import { createPortal, createRoot } from '@rbxts/react-roblox'
import { ShipSpawnerTag } from 'ReplicatedStorage/shared/constants/tags'
import { RootProvider } from 'StarterPlayer/StarterPlayerScripts/Gui/providers/RootProvider'
import { Functions } from 'StarterPlayer/StarterPlayerScripts/network'

@Component({ tag: ShipSpawnerTag })
export class ShipSpawnerComponent
  extends BaseComponent<{}, ShipSpawner>
  implements OnStart
{
  root = createRoot(new Instance('Folder'))

  // Called by GUIController when the component is removed
  onRemoved() {
    this.root.unmount()
  }

  onStart() {
    this.root.render(
      createPortal(
        <StrictMode>
          <RootProvider>
            <frame BackgroundTransparency={1} Size={new UDim2(1, 0, 1, 0)}>
              <textbutton
                BackgroundColor3={Color3.fromRGB(0, 0, 0)}
                BackgroundTransparency={0.5}
                Position={new UDim2(0, 0, 0.4, 0)}
                Size={new UDim2(1, 0, 0.2, 0)}
                Event={{
                  Activated: () => this.spawnShip(),
                }}
              >
                <textlabel
                  BackgroundTransparency={1}
                  Position={new UDim2(0, 0, 0, 0)}
                  Size={new UDim2(1, 0, 1, 0)}
                  Text={'Spawn Ship'}
                  TextColor3={Color3.fromRGB(255, 255, 255)}
                  TextSize={14}
                  TextScaled={true}
                />
              </textbutton>
              <textlabel
                BackgroundColor3={Color3.fromRGB(82, 198, 242)}
                BackgroundTransparency={0.5}
                Position={new UDim2(0, 0, 0.8, 0)}
                Size={new UDim2(1, 0, 0.2, 0)}
                Text={'Fly Safe!'}
                TextColor3={Color3.fromRGB(255, 255, 255)}
                TextScaled={true}
                TextSize={14}
              />
            </frame>
          </RootProvider>
        </StrictMode>,
        this.instance.Screen.SurfaceGui,
      ),
    )
  }

  spawnShip() {
    Functions.spawnShip.invoke('OlReliable')
  }
}
