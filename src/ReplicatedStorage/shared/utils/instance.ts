import { CollectionService } from '@rbxts/services'

export const getCharacter = (player: Player) =>
  player.Character as PlayerCharacter | undefined

export function createAnimation(name: string, id: number, parent: Instance) {
  const anim = new Instance('Animation')
  anim.Name = name
  anim.AnimationId = `rbxassetid://${id}`
  anim.Parent = parent
  return anim
}

export function findFirstChildWhichIs<X = Instance>(
  ancestor: Instance,
  childName: string,
  className: keyof Instances,
) {
  for (const child of ancestor.GetChildren()) {
    if (child.Name === childName && child.IsA(className)) return child as X
  }
  return undefined
}

export function findFirstChildWithAttributeValue<X = Instance>(
  ancestor: Instance,
  attributeName: string,
  attributeValue: AttributeValue,
) {
  for (const child of ancestor.GetChildren()) {
    if (child.GetAttribute(attributeName) === attributeValue) return child as X
  }
  return undefined
}

export function findDescendentsWhichAre<X = Instance>(
  ancestor: Instance,
  className: keyof Instances,
  options?: { includeSelf?: boolean },
) {
  assert(typeOf(ancestor) === 'Instance', 'Expected Instance ancestor')
  assert(typeOf(className) === 'string', 'Expected string className')
  const descendents = []
  if (options?.includeSelf && ancestor.IsA(className))
    descendents.push(ancestor)
  for (const descendent of ancestor.GetDescendants()) {
    if (descendent.IsA(className)) descendents.push(descendent)
  }
  return descendents as X[]
}

export function findDescendentWithPath<X = Instance>(
  ancestor: Instance | undefined,
  path?: string[],
): X | undefined {
  if (!ancestor || !path?.size()) return undefined
  let descendent: Instance | undefined = ancestor
  for (const name of path) {
    descendent = descendent.FindFirstChild(name)
    if (!descendent) return undefined
  }
  return descendent as X
}

export function findDescendentsWithTag(
  ancestor: Instance | undefined,
  tagName: string,
) {
  if (!ancestor) return []
  assert(typeOf(ancestor) === 'Instance', 'Expected Instance ancestor')
  const descendents = []
  for (const descendent of ancestor.GetDescendants()) {
    if (CollectionService.HasTag(descendent, tagName))
      descendents.push(descendent)
  }
  return descendents
}

export function grandParentIs(
  instance: Instance | undefined,
  grandParent: Instance | undefined,
) {
  return instance && instance.Parent && instance.Parent.Parent === grandParent
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

export function updateBodyVelocity(
  instance: Instance,
  velocity?: Vector3,
  options?: {
    additive?: boolean
    requireAlreadyExists?: boolean
  },
) {
  const parent = instance.IsA('Model') ? instance.PrimaryPart : instance
  if (!parent || !parent.IsA('BasePart'))
    throw "Instance doesn't have a PrimaryPart and is not a BasePart"
  const existingBodyVelocity =
    parent.FindFirstChild<BodyVelocity>('BodyVelocity')
  if (options?.requireAlreadyExists && !existingBodyVelocity) return undefined
  if (!velocity) {
    existingBodyVelocity?.Destroy()
    return undefined
  }
  const bodyVelocity =
    existingBodyVelocity || new Instance('BodyVelocity', parent)
  if (!existingBodyVelocity) {
    bodyVelocity.P = math.huge
    bodyVelocity.MaxForce = new Vector3(1000000000, 1000000000, 1000000000)
    bodyVelocity.Velocity = new Vector3(0, 0, 0)
  }
  bodyVelocity.Velocity = options?.additive
    ? bodyVelocity.Velocity.add(velocity)
    : velocity
  if (bodyVelocity.Velocity.Magnitude < 0.01) {
    bodyVelocity.Destroy()
    return undefined
  }
  return bodyVelocity
}

export function updateBodyAngularVelocity(
  instance: Instance,
  velocity?: Vector3,
  options?: {
    additive?: boolean
    requireAlreadyExists?: boolean
  },
) {
  const parent = instance.IsA('Model') ? instance.PrimaryPart : instance
  if (!parent || !parent.IsA('BasePart'))
    throw "Instance doesn't have a PrimaryPart and is not a BasePart"
  const existingBodyAngularVelocity =
    parent.FindFirstChild<BodyAngularVelocity>('BodyAngularVelocity')
  if (options?.requireAlreadyExists && !existingBodyAngularVelocity)
    return undefined
  if (!velocity) {
    existingBodyAngularVelocity?.Destroy()
    return undefined
  }
  const bodyAngularVelocity =
    existingBodyAngularVelocity || new Instance('BodyAngularVelocity', parent)
  if (!existingBodyAngularVelocity) {
    bodyAngularVelocity.P = math.huge
    bodyAngularVelocity.MaxTorque = new Vector3(10000000, 10000000, 10000000)
    bodyAngularVelocity.AngularVelocity = new Vector3(0, 0, 0)
  }
  bodyAngularVelocity.AngularVelocity = options?.additive
    ? bodyAngularVelocity.AngularVelocity.add(velocity)
    : velocity
  if (bodyAngularVelocity.AngularVelocity.Magnitude < 0.01) {
    bodyAngularVelocity.Destroy()
    return undefined
  }
  return bodyAngularVelocity
}
