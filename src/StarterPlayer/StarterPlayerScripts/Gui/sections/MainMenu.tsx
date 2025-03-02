import React from '@rbxts/react'
import { palette } from 'ReplicatedStorage/shared/constants/palette'
import { fonts } from 'StarterPlayer/StarterPlayerScripts/fonts'

export function MainMenu() {
  return (
    <screengui>
      <frame
        Position={new UDim2(0.2, 0, 0.2, 0)}
        Size={new UDim2(0.8, 0, 0.8, 0)}
        BackgroundColor3={palette.purple}
        BorderColor3={palette.pink}
        Transparency={0.3}
      >
        <uilistlayout
          FillDirection="Vertical"
          VerticalAlignment="Center"
          HorizontalAlignment="Center"
          SortOrder="LayoutOrder"
        />
        <textlabel
          Text="Station A33"
          FontFace={fonts.inter.regular}
          TextColor3={palette.text}
          LayoutOrder={1}
        />
        <textbutton
          Text="Play"
          FontFace={fonts.inter.regular}
          LayoutOrder={2}
          BackgroundColor3={palette.blue}
        >
          <uicorner CornerRadius={new UDim(3)} />
        </textbutton>
        <textbutton
          Text="Store"
          FontFace={fonts.inter.regular}
          LayoutOrder={3}
          BackgroundColor3={palette.blue}
        />
        <textbutton
          Text="Trade"
          FontFace={fonts.inter.regular}
          LayoutOrder={4}
          BackgroundColor3={palette.blue}
        />
      </frame>
    </screengui>
  )
}
