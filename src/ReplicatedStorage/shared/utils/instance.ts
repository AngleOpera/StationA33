import { CollectionService } from '@rbxts/services'

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

export function findPathToDescendent(
  ancestor: Instance | undefined,
  descendent: Instance | undefined,
) {
  if (!ancestor || !descendent) return undefined
  const path = []
  while (descendent && descendent !== ancestor) {
    path.unshift(descendent.Name)
    descendent = descendent.Parent
  }
  return descendent === ancestor ? path : undefined
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
