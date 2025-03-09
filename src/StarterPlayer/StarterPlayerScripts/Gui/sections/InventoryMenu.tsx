import React from '@rbxts/react'
import { useSelector } from '@rbxts/react-reflex'
import { InventoryItemName } from 'ReplicatedStorage/shared/constants/core'
import { palette } from 'ReplicatedStorage/shared/constants/palette'
import { fonts } from 'StarterPlayer/StarterPlayerScripts/fonts'
import { useRem } from 'StarterPlayer/StarterPlayerScripts/Gui/hooks/useRem'
import { selectIsPageOpen } from 'StarterPlayer/StarterPlayerScripts/store'
import { MENU_PAGE } from 'StarterPlayer/StarterPlayerScripts/store/MenuState'
/*
export function InventoryItemViewport(props: { name: InventoryItemName }) {
const model = useMemo(() =>)


}

function setDefaultCameraView(
  camera: Camera,
  model: Model,
  cameraDepth = 0,
): void {
  const [modelCF] = model.GetBoundingBox()

  const radius = model.GetExtentsSize().Magnitude / 2
  const halfFov = math.rad(camera.FieldOfView) / 2
  const depth = radius / math.tan(halfFov) + cameraDepth
  camera.CFrame = camera.CFrame.sub(camera.CFrame.Position)
    .add(modelCF.Position)
    .add(camera.CFrame.Position.sub(modelCF.Position).Unit.mul(depth))
}

export default function ObjectViewport({
  Object,
  Depth,
  Rotation,
  children,
}: ObjectViewportProps) {
  Rotation ??= new CFrame()
  const model = !t.nil(Object) ? Object.Clone() : Make('Model', {})
  const viewportCamera = Make('Camera', {})
  setDefaultCameraView(viewportCamera, model, Depth)

  effect(() => {
    const noRotation = CFrame.new(model.GetPivot().Position)
    model.PivotTo(noRotation.mul(read(Rotation)))
  })

  return (
    <viewportframe
      CurrentCamera={viewportCamera}
      Size={UDim2.fromScale(0.5, 0.5)}
    >
      {viewportCamera}
      {model}
      {children}
    </viewportframe>
  )
}

/**

export default function ObjectViewport({
  Object,
  Depth,
  Rotation,
  children,
}: ObjectViewportProps) {
  Rotation ??= 0
  const model = !t.nil(Object) ? Object.Clone() : Make('Model', {})
  const viewportCamera = Make('Camera', {})
  setDefaultCameraView(viewportCamera, model, Depth)
  model.PivotTo(
    model.GetPivot().mul(CFrame.fromEulerAnglesXYZ(0, read(Rotation), 0)),
  )

  return (
    <viewportframe CurrentCamera={viewportCamera} Size={UDim2.fromScale(1, 1)}>
      {viewportCamera}
      {model}
      {children}
    </viewportframe>
  )
     *
 * @param param0
 */

export function InventoryMenu() {
  const rem = useRem()
  const opened = useSelector(selectIsPageOpen(MENU_PAGE.Inventory))
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
              TextSize={rem(5)}
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
              ClipsDescendants={false}
              Selectable={false}
              Size={new UDim2(0.8, 0, 0.8, 0)}
            >
              <uigridlayout>
                <viewportframe>
                  <camera>
                    <imagelabel
                      Image="rbxassetid://613887973"
                      ImageTransparency={0.15}
                      BackgroundTransparency={1}
                      Size={new UDim2(1, 0, 1, 0)}
                      ZIndex={-1}
                    >
                      <uicorner CornerRadius={new UDim(0.3)} />
                    </imagelabel>
                  </camera>
                </viewportframe>
              </uigridlayout>
            </scrollingframe>
          </frame>
        </frame>
      </screengui>
    )
  )
}
