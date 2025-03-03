import React, { useState } from '@rbxts/react'
import { useSelector } from '@rbxts/react-reflex'
import { palette } from 'ReplicatedStorage/shared/constants/palette'
import { fonts } from 'StarterPlayer/StarterPlayerScripts/fonts'
import { useRem } from 'StarterPlayer/StarterPlayerScripts/Gui/hooks/useRem'
import {
  selectIsMenuOpen,
  store,
} from 'StarterPlayer/StarterPlayerScripts/store'

export function MainButton(props: {
  Text: string
  Event?: React.InstanceEvent<TextButton>
}) {
  const rem = useRem()
  const [hover, setHover] = useState(false)

  return (
    <frame
      BackgroundColor3={hover ? palette.grass : palette.blue}
      BackgroundTransparency={hover ? 0.3 : 0.6}
      Event={{
        MouseEnter: () => setHover(true),
        MouseLeave: () => setHover(false),
      }}
      Size={new UDim2(0.5, 0, 0.1, 0)}
    >
      <uicorner CornerRadius={new UDim(1)} />
      <uistroke Color={hover ? palette.lime : palette.sky} Thickness={3} />
      <textbutton
        Text={props.Text}
        TextSize={rem(5)}
        Size={new UDim2(1, 0, 1, 0)}
        FontFace={fonts.inter.regular}
        BackgroundTransparency={1}
        Event={props.Event}
      >
        <uipadding PaddingTop={new UDim(0.2)} />
        <uistroke Color={hover ? palette.lime : palette.sky} Thickness={2} />
      </textbutton>
    </frame>
  )
}

export function MainMenu() {
  const rem = useRem()
  const opened = useSelector(selectIsMenuOpen)
  return (
    opened && (
      <screengui>
        <frame
          Position={new UDim2(0.05, 0, 0.01, 0)}
          Size={new UDim2(0.9, 0, 0.9, 0)}
          BackgroundTransparency={1}
        >
          <frame Size={new UDim2(1, 0, 1, 0)} BackgroundTransparency={1}>
            <imagelabel
              Image="rbxassetid://613887973"
              ImageTransparency={0.15}
              BackgroundTransparency={1}
              Size={new UDim2(1, 0, 1, 0)}
              ZIndex={-1}
            >
              <uicorner CornerRadius={new UDim(0.3)} />
            </imagelabel>
          </frame>
          <frame
            Size={new UDim2(1, 0, 1, 0)}
            BackgroundColor3={palette.purple}
            BorderColor3={palette.pink}
            Transparency={0.3}
          >
            <uicorner CornerRadius={new UDim(0.3)} />
            <uistroke Color={palette.magenta} Thickness={3} />
            <uilistlayout
              FillDirection="Vertical"
              VerticalAlignment="Center"
              HorizontalAlignment="Center"
              Padding={new UDim(0, rem(4))}
              SortOrder="LayoutOrder"
            />
            <textlabel
              Text="Station A33"
              TextSize={rem(10)}
              AutomaticSize="XY"
              BackgroundTransparency={1}
              FontFace={fonts.inter.regular}
              TextColor3={palette.text}
            >
              <uistroke Color={palette.pink} Thickness={2} />
            </textlabel>
            <MainButton
              Text="Play"
              Event={{ Activated: () => store.setMenuOpen(false) }}
            />
            <MainButton Text="Store" />
            <MainButton Text="Trade" />
          </frame>
        </frame>
      </screengui>
    )
  )
}
