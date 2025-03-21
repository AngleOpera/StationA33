import { useAsync } from '@rbxts/pretty-react-hooks'
import React, { useCallback, useEffect, useMemo, useRef } from '@rbxts/react'
import { useSelector } from '@rbxts/react-reflex'
import { ReplicatedStorage } from '@rbxts/services'
import {
  InventoryItemName,
  PLACEABLE_INVENTORY_NAMES,
} from 'ReplicatedStorage/shared/constants/core'
import { palette } from 'ReplicatedStorage/shared/constants/palette'
import { fonts } from 'StarterPlayer/StarterPlayerScripts/fonts'
import { useController } from 'StarterPlayer/StarterPlayerScripts/Gui/hooks/useController'
import { useRem } from 'StarterPlayer/StarterPlayerScripts/Gui/hooks/useRem'
import {
  selectIsPageOpen,
  store,
} from 'StarterPlayer/StarterPlayerScripts/store'
import { MENU_PAGE } from 'StarterPlayer/StarterPlayerScripts/store/MenuState'

export function InventoryItem(props: {
  name: InventoryItemName
  rem: (size: number) => number
  cameraDepth?: number
  cameraFov?: number
  onClick: (name: InventoryItemName) => void
}) {
  const viewportRef = useRef<ViewportFrame>()
  const camera = useMemo(() => new Instance('Camera'), [])
  const worldModel = useMemo(() => new Instance('WorldModel'), [])
  const [model] = useAsync(
    async () => ReplicatedStorage.Items[props.name].Clone(),
    [props.name],
  )

  useEffect(() => {
    if (model) model.Parent = worldModel
  }, [model, worldModel])

  useEffect(() => {
    worldModel.Parent = viewportRef.current
  }, [worldModel, viewportRef])

  useEffect(() => {
    if (!model) return
    const pivot = model.GetPivot()
    camera.CFrame = CFrame.lookAt(
      pivot.mul(new CFrame(-3, 3, -3)).Position,
      pivot.Position,
    )
  }, [camera, model])

  return (
    <imagebutton
      BackgroundTransparency={0.7}
      Event={{ Activated: () => props.onClick(props.name) }}
    >
      <uicorner CornerRadius={new UDim(0.3)} />
      <uistroke Color={palette.text} Thickness={1} />
      <viewportframe
        Size={new UDim2(1.0, 0, 1.0, 0)}
        ref={viewportRef}
        CurrentCamera={camera}
        BackgroundTransparency={0.7}
      >
        <uicorner CornerRadius={new UDim(0.3)} />
        <textlabel
          Text={props.name}
          TextSize={props.rem(2)}
          Font={Enum.Font.FredokaOne}
          Position={new UDim2(0.25, 0, 0.8, 0)}
          Size={new UDim2(0.5, 0, 0.2, 0)}
          TextColor3={palette.text}
          BackgroundTransparency={1}
          ZIndex={5}
        >
          <uistroke Color={palette.black} Thickness={1} />
        </textlabel>
      </viewportframe>
    </imagebutton>
  )
}

export function InventoryMenu() {
  const rem = useRem()
  const controller = useController()
  const opened = useSelector(selectIsPageOpen(MENU_PAGE.Inventory))
  const selectItem = useCallback(
    (name: InventoryItemName) => {
      controller.placeBlockController?.setItem(name)
      store.setMenuOpen(false)
    },
    [controller],
  )
  const closeMenu = useCallback(() => {
    controller.placeBlockController?.unequipPlaceBlockTool()
    store.setMenuOpen(false)
  }, [])

  return (
    opened && (
      <screengui>
        <frame Size={new UDim2(1, 0, 1, 0)} BackgroundTransparency={1}>
          <imagebutton
            BackgroundTransparency={1}
            Transparency={1}
            Size={new UDim2(1, 0, 1, 0)}
            Event={{ Activated: closeMenu }}
          />
        </frame>
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
            BackgroundColor3={palette.blue}
            BorderColor3={palette.sky}
            Transparency={0.3}
          >
            <uicorner CornerRadius={new UDim(0.3)} />
            <uistroke Color={palette.sky} Thickness={3} />
            <uilistlayout
              FillDirection="Vertical"
              VerticalAlignment="Center"
              HorizontalAlignment="Center"
              Padding={new UDim(0, rem(4))}
              SortOrder="LayoutOrder"
            />
            <textlabel
              Text="Inventory"
              TextSize={rem(2.5)}
              AutomaticSize="XY"
              BackgroundTransparency={1}
              FontFace={fonts.inter.regular}
              TextColor3={palette.text}
            >
              <uistroke Color={palette.orange} Thickness={2} />
            </textlabel>

            <scrollingframe
              ScrollBarImageColor3={palette.text}
              ScrollBarImageTransparency={0.5}
              ScrollBarThickness={rem(1)}
              VerticalScrollBarInset={Enum.ScrollBarInset.Always}
              BackgroundTransparency={1}
              BorderSizePixel={0}
              ClipsDescendants={true}
              Selectable={false}
              Size={new UDim2(0.8, 0, 0.8, 0)}
            >
              <frame Size={new UDim2(1, 0, 1, 0)} BackgroundTransparency={1}>
                <uipadding
                  PaddingTop={new UDim(0.01, 0)}
                  PaddingLeft={new UDim(0.02, 0)}
                  PaddingRight={new UDim(0.02, 0)}
                />
                <uigridlayout
                  CellPadding={new UDim2(0.02, 0, 0.015, 0)}
                  CellSize={new UDim2(0.15, 0, 0.09, 0)}
                />
                {PLACEABLE_INVENTORY_NAMES.map((name) => (
                  <InventoryItem
                    key={name}
                    name={name}
                    rem={rem}
                    onClick={selectItem}
                  />
                ))}
              </frame>
            </scrollingframe>
          </frame>
        </frame>
      </screengui>
    )
  )
}
