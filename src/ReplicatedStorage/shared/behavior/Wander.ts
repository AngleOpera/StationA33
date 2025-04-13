import {
  BEHAVIOR_TREE_STATUS,
  BehaviorObject,
} from 'ReplicatedStorage/shared/utils/behavior'

export function run(obj: BehaviorObject, ..._args: unknown[]) {
  const { sourceHumanoid } = obj.Blackboard

  if (sourceHumanoid && sourceHumanoid.Health !== 0) {
    sourceHumanoid.WalkSpeed = 16

    const randomWalk = math.random(1, 150)
    const terrain = game.Workspace.PlayerSpaces['0'].Plot.Baseplate

    if (terrain && randomWalk === 1) {
      sourceHumanoid.MoveTo(
        terrain.Position.add(
          new Vector3(math.random(-1024, 1024), 0, math.random(-1024, 1024)),
        ),
        terrain,
      )
    }
  }
  return BEHAVIOR_TREE_STATUS.SUCCESS
}
