import React from '@rbxts/react'
import { palette } from 'ReplicatedStorage/shared/constants/palette'
import { ErrorBoundary } from 'StarterPlayer/StarterPlayerScripts/Gui/components/ErrorBoundary'

interface ErrorHandlerProps extends React.PropsWithChildren {}

export function ErrorHandler({ children }: ErrorHandlerProps) {
  return (
    <ErrorBoundary
      fallback={(message) => {
        return (
          <screengui>
            <frame
              Size={new UDim2(1, 0, 1, 0)}
              BackgroundColor3={palette.eerie}
            >
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
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
