import { BehaviorTree3 } from '@rbxts/behavior-tree-5'
import SimplePath from '@rbxts/simplepath'
import {
  ClientNetworkEvents,
  ServerNetworkEvents,
} from 'ReplicatedStorage/shared/network'
import { SharedState, SharedStore } from 'ReplicatedStorage/shared/state'
import { getLogger } from 'ReplicatedStorage/shared/utils/core'

export enum PathStatus {
  Running = 0,
  Reached = 1,
  Blocked = 2,
  Error = 3,
  Stopped = 4,
}

export enum BehaviorPlanType {
  Arcade = 1,
  Tycoon = 2,
}

export interface BehaviorPlan {
  status: string
  targetAttachment: Attachment
  targetSeat?: Seat
  type: BehaviorPlanType
}

export type BehaviorPlans = Partial<Record<BehaviorPlanType, BehaviorPlan>>

export interface BehaviorObject {
  attackDebounce?: boolean
  Blackboard: Record<string, unknown> & {
    clientNetwork?: ClientNetworkEvents
    obstacle?: BasePart
    obstaclePos?: Vector3
    path?: SimplePath
    plan?: BehaviorPlans
    serverNetwork?: ServerNetworkEvents
    serverStore?: SharedStore
    sourceAttachment?: Attachment
    sourceHumanoid?: Humanoid
    sourceHumanoidRootPart?: BasePart
    sourceInstance?: Instance
    sourceUserId?: number
    status?: string
    state?: SharedState
    targetAttachment?: Attachment
    targetPart?: BasePart
    targetHumanoid?: Humanoid
    targetHumanoidRootPart?: BasePart
    targetSeat?: Seat
    time?: number
  }
  pathDisabled?: boolean
  pathError?: string
  pathStatus?: PathStatus
  previousPosition?: Vector3
  previousPositionTime?: number
  previousRunningTime?: number
  startedRunningTime?: number
  stuckCount?: number
  treeRunning: boolean
}

export const BEHAVIOR_TREE_STATUS = {
  SUCCESS: 1 as const,
  FAIL: 2 as const,
  RUNNING: 3 as const,
}

export function addBehaviorPlan(obj: BehaviorObject, plan: BehaviorPlan) {
  if (!obj.Blackboard.plan) obj.Blackboard.plan = {}
  obj.Blackboard.plan[plan.type] = plan
  obj.Blackboard.status = plan.status
  obj.Blackboard.targetAttachment = plan.targetAttachment
}

export function getBehaviorTime(obj: BehaviorObject) {
  if (!obj.Blackboard.time) obj.Blackboard.time = time()
  return obj.Blackboard.time
}

export function waitAfterBehaviorCompleted(
  obj: BehaviorObject,
  secondsAgo: number,
) {
  if (!obj.previousRunningTime) return true
  return secondsAgo < getBehaviorTime(obj) - obj.previousRunningTime
}

export function stopPathFinding(obj: BehaviorObject) {
  if (obj.pathStatus === PathStatus.Running && obj.Blackboard.path)
    obj.Blackboard.path.Stop()
  obj.pathStatus = PathStatus.Stopped
}

export function runBehaviorTree(
  behaviorTree: BehaviorTree3<BehaviorObject>,
  obj: BehaviorObject,
  state: SharedState,
) {
  try {
    const wasRunning = obj.treeRunning
    const blackboard = obj.Blackboard
    blackboard.state = state
    const treeRunning = behaviorTree?.run(obj) === BEHAVIOR_TREE_STATUS.RUNNING
    obj.treeRunning = treeRunning
    if (treeRunning) {
      const now = getBehaviorTime(obj)
      obj.previousRunningTime = now
      if (!wasRunning) obj.startedRunningTime = now
    }
  } catch (e) {
    getLogger().Warn(`Error running behavior tree: ${e}`)
  }
}
