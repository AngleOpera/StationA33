export function createAnimation(name: string, id: number, parent: Instance) {
  const anim = new Instance('Animation')
  anim.Name = name
  anim.AnimationId = `rbxassetid://${id}`
  anim.Parent = parent
  return anim
}
