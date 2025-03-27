import Object from '@rbxts/object-utils'
import { useAsync } from '@rbxts/pretty-react-hooks'
import React, { useCallback, useEffect, useMemo, useRef } from '@rbxts/react'
import { useSelector } from '@rbxts/react-reflex'
import { ReplicatedStorage } from '@rbxts/services'
import {
  INVENTORY,
  InventoryItemName,
  USER_ID,
} from 'ReplicatedStorage/shared/constants/core'
import { palette } from 'ReplicatedStorage/shared/constants/palette'
import {
  selectPlayerContainer,
  selectPlayerInventory,
} from 'ReplicatedStorage/shared/state'
import { fonts } from 'StarterPlayer/StarterPlayerScripts/fonts'
import { useController } from 'StarterPlayer/StarterPlayerScripts/Gui/hooks/useController'
import { useRem } from 'StarterPlayer/StarterPlayerScripts/Gui/hooks/useRem'
import { Functions } from 'StarterPlayer/StarterPlayerScripts/network'
import {
  selectIsPageOpenWithContainer,
  store,
} from 'StarterPlayer/StarterPlayerScripts/store'
import { MENU_PAGE } from 'StarterPlayer/StarterPlayerScripts/store/MenuState'

export function InventoryItem(props: {
  name: InventoryItemName
  rem: (size: number) => number
  cameraDepth?: number
  cameraFov?: number
  count?: number
  onClick: (name: InventoryItemName) => void
}) {
  const viewportRef = useRef<ViewportFrame>()
  const camera = useMemo(() => new Instance('Camera'), [])
  const worldModel = useMemo(() => new Instance('WorldModel'), [])
  const [model] = useAsync(
    async () => ReplicatedStorage.Items[props.name].Clone(),
    [props.name],
  )
  const item = INVENTORY[props.name]

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
      pivot.mul(new CFrame(-item.size[0], item.size[1] * 3, item.size[2] + 4))
        .Position,
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
        {!!props.count && (
          <textlabel
            Text={`${props.count}`}
            TextSize={props.rem(1.3)}
            Font={Enum.Font.LuckiestGuy}
            Position={new UDim2(1, -props.rem(0.3), 1, -props.rem(0.3))}
            TextColor3={palette.text}
            BackgroundTransparency={1}
            ZIndex={5}
          >
            <uistroke Color={palette.black} Thickness={1} />
          </textlabel>
        )}
      </viewportframe>
    </imagebutton>
  )
}

export function InventoryMenu(props: {
  backgroundColor: Color3
  borderColor: Color3
  inventory?: Partial<Record<InventoryItemName, number>>
  position: UDim2
  size: UDim2
  selectItem: (name: InventoryItemName) => void
  title: string
  titleColor: Color3
}) {
  const rem = useRem()
  return (
    <frame
      Position={props.position}
      Size={props.size}
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
          <uicorner CornerRadius={new UDim(0.05)} />
        </imagelabel>
      </frame>
      <frame
        Size={new UDim2(1, 0, 1, 0)}
        BackgroundColor3={props.backgroundColor}
        BorderColor3={props.borderColor}
        Transparency={0.3}
      >
        <uicorner CornerRadius={new UDim(0.05)} />
        <uistroke Color={props.borderColor} Thickness={3} />
        <textlabel
          Text={props.title}
          TextSize={rem(1.4)}
          AutomaticSize="XY"
          BackgroundTransparency={1}
          FontFace={fonts.inter.regular}
          TextColor3={palette.text}
          AnchorPoint={new Vector2(0.5, 0)}
          Position={new UDim2(0.5, 0, 0, -rem(1.4) / 2)}
        >
          <uistroke Color={props.titleColor} Thickness={2} />
        </textlabel>
        <frame
          Position={new UDim2(0.025, 0, 0.025, 0)}
          Size={new UDim2(0.95, 0, 0.95, 0)}
          BackgroundTransparency={1}
        >
          <scrollingframe
            ScrollBarImageColor3={palette.text}
            ScrollBarImageTransparency={0.3}
            ScrollBarThickness={rem(1)}
            VerticalScrollBarInset={Enum.ScrollBarInset.Always}
            BackgroundTransparency={1}
            BorderSizePixel={0}
            ClipsDescendants={true}
            Selectable={false}
            Size={new UDim2(1, 0, 0.95, 0)}
          >
            <frame Size={new UDim2(1, 0, 1, 0)} BackgroundTransparency={1}>
              <uipadding
                PaddingTop={new UDim(0.01, 0)}
                PaddingLeft={new UDim(0.02, 0)}
                PaddingRight={new UDim(0.02, 0)}
              />
              <uigridlayout
                CellPadding={new UDim2(0.02, 0, 0.015, 0)}
                CellSize={new UDim2(0.12, 0, 0.12, 0)}
              />
              <uiaspectratioconstraint AspectRatio={1} />
              {Object.entries(props.inventory ?? {}).map(([name, count]) => (
                <InventoryItem
                  key={name}
                  name={name}
                  count={count}
                  rem={rem}
                  onClick={props.selectItem}
                />
              ))}
            </frame>
          </scrollingframe>
        </frame>
      </frame>
    </frame>
  )
}

export function PlaceBlockInventoryMenu() {
  const controller = useController()
  const inventory = useSelector(selectPlayerInventory(USER_ID))
  const closeMenu = useCallback(() => {
    controller.placeBlockController?.unequipPlaceBlockTool()
    store.setMenuOpen(false)
  }, [])
  const selectItem = useCallback(
    (name: InventoryItemName) => {
      controller.placeBlockController?.setItem(name)
      store.setMenuOpen(false)
    },
    [controller],
  )
  return (
    <screengui>
      <frame Size={new UDim2(1, 0, 1, 0)} BackgroundTransparency={1}>
        <imagebutton
          BackgroundTransparency={1}
          Transparency={1}
          Size={new UDim2(1, 0, 1, 0)}
          Event={{ Activated: closeMenu }}
        />
      </frame>
      <InventoryMenu
        title="Inventory"
        inventory={inventory}
        position={new UDim2(0.35, 0, 0.01, 0)}
        size={new UDim2(0.3, 0, 0.7, 0)}
        backgroundColor={palette.blue}
        borderColor={palette.sky}
        titleColor={palette.orange}
        selectItem={selectItem}
      />
    </screengui>
  )
}

export function ContainerInventoryMenu(props: { container: string }) {
  const inventory = useSelector(selectPlayerInventory(USER_ID))
  const container = useSelector(selectPlayerContainer(USER_ID, props.container))
  const closeMenu = useCallback(() => store.setMenuOpen(false), [])
  const selectInventoryItem = useCallback(
    (name: InventoryItemName) =>
      Functions.moveItem(props.container, name, -(inventory?.[name] ?? 0)),
    [inventory],
  )
  const selectContainerItem = useCallback(
    (name: InventoryItemName) =>
      Functions.moveItem(props.container, name, container?.[name] ?? 0),
    [container],
  )
  return (
    <screengui>
      <frame Size={new UDim2(1, 0, 1, 0)} BackgroundTransparency={1}>
        <imagebutton
          BackgroundTransparency={1}
          Transparency={1}
          Size={new UDim2(1, 0, 1, 0)}
          Event={{ Activated: closeMenu }}
        />
      </frame>
      <InventoryMenu
        title="Inventory"
        inventory={inventory}
        position={new UDim2(0.245, 0, 0.01, 0)}
        size={new UDim2(0.3, 0, 0.7, 0)}
        backgroundColor={palette.blue}
        borderColor={palette.sky}
        titleColor={palette.orange}
        selectItem={selectInventoryItem}
      />
      <InventoryMenu
        title="Container"
        inventory={container}
        position={new UDim2(0.555, 0, 0.01, 0)}
        size={new UDim2(0.2, 0, 0.7, 0)}
        backgroundColor={palette.sky}
        borderColor={palette.text}
        titleColor={palette.blue}
        selectItem={selectContainerItem}
      />
    </screengui>
  )
}

export function InventorySection() {
  const page = useSelector(selectIsPageOpenWithContainer(MENU_PAGE.Inventory))
  if (!page.opened) return undefined
  return page.container ? (
    <ContainerInventoryMenu container={page.container} />
  ) : (
    <PlaceBlockInventoryMenu />
  )
}
