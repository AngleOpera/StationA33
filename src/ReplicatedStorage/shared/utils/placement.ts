export interface PlacementData {
  readonly itemId: number
  readonly rotation: number
}

export type PlacementMap = Record<string, string>

export interface PlacementLocation {
  x: number
  z: number
}

export const placementBlockSize = 3

export function getPlacementLocationFromWorldPosition(
  x: number,
  z: number,
  baseplate: BasePart,
): PlacementLocation {
  const baseplateCorner = baseplate.CFrame.Position.sub(baseplate.Size.div(2))
  return {
    x: math.max(0, math.floor((x - baseplateCorner.X) / placementBlockSize)),
    z: math.max(0, math.floor((z - baseplateCorner.Z) / placementBlockSize)),
  }
}

export function getCFrameFromPlacementLocation(
  location: PlacementLocation,
  baseplate: BasePart,
): CFrame {
  return baseplate.CFrame.ToWorldSpace(
    new CFrame(
      location.x * placementBlockSize +
        placementBlockSize / 2 -
        baseplate.Size.X / 2,
      (baseplate.Size.Y + placementBlockSize) / 2,
      location.z * placementBlockSize +
        placementBlockSize / 2 -
        baseplate.Size.Z / 2,
    ),
  )
}
