import { findDescendentsWhichAre } from 'ReplicatedStorage/shared/utils/instance'

export function startNewFactoryBlockAnimation(model: Model): undefined {
  if (!model.Parent) return

  // Synchronize conveyor animations - XXX move to client
  for (const beam of findDescendentsWhichAre<Beam>(model.Parent, 'Beam')) {
    beam.SetTextureOffset(0)
    // print('set texture offset', beam.Name, model.Name)
  }
}
