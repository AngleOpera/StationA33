import React, { useState } from '@rbxts/react'
import { useSelector } from '@rbxts/react-reflex'
import { palette } from 'ReplicatedStorage/shared/constants/palette'
import { fonts } from 'StarterPlayer/StarterPlayerScripts/fonts'
import { useRem } from 'StarterPlayer/StarterPlayerScripts/Gui/hooks/useRem'
import {
  selectIsMenuOpen,
  store,
} from 'StarterPlayer/StarterPlayerScripts/store'

export function MainMenu() {
  const rem = useRem()
  const opened = useSelector(selectIsMenuOpen)
  const [playHover, setPlayHover] = useState(false)
  const [storeHover, setStoreHover] = useState(false)
  const [tradeHover, setTradeHover] = useState(false)
  return (
    opened && (
      <screengui>
        <frame
          Position={new UDim2(0.1, 0, 0.1, 0)}
          Size={new UDim2(0.8, 0, 0.8, 0)}
          BackgroundColor3={palette.purple}
          BorderColor3={palette.pink}
          Transparency={0.3}
        >
          <uicorner CornerRadius={new UDim(1)} />
          <uilistlayout
            FillDirection="Vertical"
            VerticalAlignment="Center"
            HorizontalAlignment="Center"
            Padding={new UDim(0, rem(2))}
            SortOrder="LayoutOrder"
          />
          <textlabel
            Text="Station A33"
            TextSize={rem(10)}
            AutomaticSize="XY"
            BackgroundTransparency={1}
            FontFace={fonts.inter.regular}
            TextColor3={palette.text}
          />
          <textbutton
            Text="Play"
            TextSize={rem(5)}
            AutomaticSize="XY"
            FontFace={fonts.inter.regular}
            BackgroundColor3={playHover ? palette.green : palette.blue}
            Event={{
              Activated: () => store.setMenuOpen(false),
              MouseEnter: () => setPlayHover(true),
              MouseLeave: () => setPlayHover(false),
            }}
          >
            <uicorner CornerRadius={new UDim(1)} />
          </textbutton>
          <textbutton
            Text="Store"
            TextSize={rem(5)}
            AutomaticSize="XY"
            FontFace={fonts.inter.regular}
            BackgroundColor3={storeHover ? palette.green : palette.blue}
            Event={{
              MouseEnter: () => setStoreHover(true),
              MouseLeave: () => setStoreHover(false),
            }}
          >
            <uicorner CornerRadius={new UDim(1)} />
          </textbutton>
          <textbutton
            Text="Trade"
            TextSize={rem(5)}
            AutomaticSize="XY"
            FontFace={fonts.inter.regular}
            BackgroundColor3={tradeHover ? palette.green : palette.blue}
            Event={{
              MouseEnter: () => setTradeHover(true),
              MouseLeave: () => setTradeHover(false),
            }}
          >
            <uicorner CornerRadius={new UDim(1)} />
          </textbutton>
        </frame>
      </screengui>
    )
  )
}
