import { findDescendentsWhichAre } from 'ReplicatedStorage/shared/utils/instance'

export function getPartLowerCorner(part: BasePart): Vector3 {
  return part.CFrame.ToWorldSpace(new CFrame(part.Size.div(-2))).Position
}

export function createBoundingPart(
  position: Vector3,
  size: Vector3,
  parent?: Instance,
) {
  const bounding = new Instance('Part')
  bounding.Name = 'Bounding'
  bounding.Position = position
  bounding.Size = size
  bounding.Anchored = true
  bounding.CanCollide = true
  bounding.Transparency = 1.0
  bounding.CollisionGroup = 'Bounding'
  if (parent) bounding.Parent = parent
  return bounding
}

export function setNetworkOwner(ancestor: Instance, player?: Player) {
  for (const descendent of ancestor.GetDescendants()) {
    if (descendent.IsA('BasePart') && descendent.CanSetNetworkOwnership()[0]) {
      descendent.SetNetworkOwner(player)
    }
  }
  if (ancestor.IsA('BasePart') && ancestor.CanSetNetworkOwnership()[0]) {
    ancestor.SetNetworkOwner(player)
  }
}

export function setHidden(ancestor: Instance, hidden: boolean) {
  for (const descendent of ancestor.GetDescendants()) {
    if (descendent.IsA('BasePart')) {
      descendent.CanCollide = !hidden
      descendent.CanTouch = !hidden
      descendent.Transparency = hidden ? 1 : 0
    } else if (
      descendent.IsA('BillboardGui') ||
      descendent.IsA('ParticleEmitter') ||
      descendent.IsA('ProximityPrompt')
    ) {
      descendent.Enabled = !hidden
    }
  }
  if (ancestor.IsA('BasePart')) {
    ancestor.CanCollide = !hidden
    ancestor.CanTouch = !hidden
    ancestor.Transparency = hidden ? 1 : 0
  }
}

export function weldParts(parts: BasePart[], rootPart?: BasePart) {
  parts.forEach((part) => {
    if (!rootPart) {
      rootPart = part
    } else {
      const weld = new Instance('WeldConstraint')
      weld.Part0 = rootPart
      weld.Part1 = part
      weld.Parent = part
    }
  })
}

export function weldTool(tool: Tool) {
  const handle = tool.FindFirstChild<BasePart>('Handle')
  if (!handle) return tool
  weldParts(findDescendentsWhichAre<BasePart>(handle, 'BasePart'), handle)
  return tool
}

export function weldAssemblage(instance: Instance) {
  const parts = findDescendentsWhichAre<BasePart>(instance, 'BasePart', {
    includeSelf: true,
  })
  if (instance.IsA('Model')) instance.PrimaryPart = parts[0]
  weldParts(parts)
  for (const part of parts) {
    part.Transparency = 0
    part.CanCollide = true
    part.Anchored = false
  }
}
