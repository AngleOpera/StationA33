import React from '@rbxts/react'
import { palette } from 'ReplicatedStorage/shared/constants/palette'

export function MainMenu(props: { message: string }) {
  const { message } = props
  return (
    <screengui>
      <frame Size={new UDim2(1, 0, 1, 0)} BackgroundColor3={palette.base}>
        <uilistlayout
          FillDirection="Vertical"
          VerticalAlignment="Center"
          HorizontalAlignment="Center"
          SortOrder="LayoutOrder"
        />
        <textlabel
          Text="System malfunction"
          TextColor3={palette.text}
          LayoutOrder={0}
        />
        <textlabel
          Text={`${message}`}
          TextColor3={palette.text}
          LayoutOrder={1}
        />
      </frame>
    </screengui>
  )
}
