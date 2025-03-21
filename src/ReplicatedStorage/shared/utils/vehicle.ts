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
