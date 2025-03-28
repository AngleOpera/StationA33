import { Controller, OnStart } from '@flamework/core'
import { RunService, UserInputService } from '@rbxts/services'
import {
  updateBodyAngularVelocity,
  updateBodyVelocity,
} from 'ReplicatedStorage/shared/utils/vehicle'

@Controller({})
export class ShipController implements OnStart {
  active?: {
    ship: Ship
    camera: Camera
    cameraType: Enum.CameraType
    config: ShipConfig
  }
  leftDown = false
  rightDown = false
  upDown = false
  downDown = false
  forwardDown = false
  backwardDown = false
  riseDown = false
  fallDown = false
  strafeLeftDown = false
  strafeRightDown = false
  rollLeftDown = false
  rollRightDown = false

  onStart() {
    UserInputService.InputBegan.Connect((inputObject, processed) => {
      if (this.active && !processed) {
        if (inputObject.UserInputType === Enum.UserInputType.MouseButton1) {
          this.active.ship.Shoot.FireServer()
        } else if (inputObject.UserInputType === Enum.UserInputType.Keyboard) {
          this.updateKeysDown(inputObject.KeyCode, true)
        }
      }
    })

    UserInputService.InputEnded.Connect((inputObject, processed) => {
      if (this.active && !processed) {
        if (inputObject.UserInputType === Enum.UserInputType.Keyboard) {
          this.updateKeysDown(inputObject.KeyCode, false)
        }
      }
    })

    for (;;) {
      const ship = this.active?.ship
      const camera = this.active?.camera
      const config = this.active?.config
      const body = ship?.FindFirstChild<BasePart>('Body')
      if (!ship || !camera || !config || !body) {
        task.wait(1)
        continue
      }
      const [deltaTime] = RunService.RenderStepped.Wait()
      camera.CoordinateFrame = camera.CoordinateFrame.Lerp(
        CFrame.lookAt(
          body.CFrame.ToWorldSpace(new CFrame(0, 30, -100)).Position,
          body.CFrame.ToWorldSpace(new CFrame(0, 10, 100)).Position,
          body.CFrame.UpVector,
        ),
        deltaTime * 15,
      )
    }
  }

  startShip(ship: Ship, config: ShipConfig) {
    if (this.active !== undefined) return
    const camera = game.Workspace.CurrentCamera
    if (!camera) return

    this.active = {
      ship,
      camera,
      cameraType: camera.CameraType,
      config,
    }

    camera.CameraType = Enum.CameraType.Scriptable
  }

  stopShip(ship: Ship) {
    if (this.active?.ship !== ship) return
    if (this.active?.cameraType)
      this.active.camera.CameraType = this.active.cameraType

    this.active = undefined
  }

  updateKeysDown(keyCode: Enum.KeyCode, down: boolean) {
    switch (keyCode) {
      case Enum.KeyCode.A:
        this.leftDown = down
        break
      case Enum.KeyCode.C:
        this.rollRightDown = down
        break
      case Enum.KeyCode.D:
        this.rightDown = down
        break
      case Enum.KeyCode.E:
        this.riseDown = down
        break
      case Enum.KeyCode.F:
        this.strafeRightDown = down
        break
      case Enum.KeyCode.Q:
        this.fallDown = down
        break
      case Enum.KeyCode.S:
        this.downDown = down
        break
      case Enum.KeyCode.W:
        this.upDown = down
        break
      case Enum.KeyCode.Z:
        this.rollLeftDown = down
        break
      case Enum.KeyCode.CapsLock:
        this.strafeLeftDown = down
        break
      case Enum.KeyCode.LeftControl:
        this.backwardDown = down
        break
      case Enum.KeyCode.LeftShift:
        this.forwardDown = down
        break
      default:
        return
    }

    const body = this.active?.ship.FindFirstChild<BasePart>('Body')
    const config = this.active?.config
    if (!body || !config) return

    let velocity = new Vector3(0, 0, 0)
    if (this.forwardDown) {
      velocity = velocity.add(body.CFrame.LookVector.mul(-config.speed))
    }
    if (this.backwardDown) {
      velocity = velocity.add(body.CFrame.LookVector.mul(config.speed))
    }
    if (this.riseDown) {
      velocity = velocity.add(body.CFrame.UpVector.mul(config.speed))
    }
    if (this.fallDown) {
      velocity = velocity.add(body.CFrame.UpVector.mul(-config.speed))
    }
    if (this.strafeLeftDown) {
      velocity = velocity.add(body.CFrame.RightVector.mul(-config.speed))
    }
    if (this.strafeRightDown) {
      velocity = velocity.add(body.CFrame.RightVector.mul(config.speed))
    }

    let angularVelocity = new Vector3(0, 0, 0)
    if (this.leftDown) {
      angularVelocity = angularVelocity.add(
        body.CFrame.UpVector.mul(config.speed),
      )
    }
    if (this.rightDown) {
      angularVelocity = angularVelocity.add(
        body.CFrame.UpVector.mul(-config.speed),
      )
    }
    if (this.upDown) {
      angularVelocity = angularVelocity.add(
        body.CFrame.RightVector.mul(-config.speed),
      )
    }
    if (this.downDown) {
      angularVelocity = angularVelocity.add(
        body.CFrame.RightVector.mul(config.speed),
      )
    }
    if (this.rollLeftDown) {
      angularVelocity = angularVelocity.add(
        body.CFrame.LookVector.mul(-config.speed),
      )
    }
    if (this.rollRightDown) {
      angularVelocity = angularVelocity.add(
        body.CFrame.LookVector.mul(config.speed),
      )
    }

    // print('updateBodyVelocity', velocity, angularVelocity)
    updateBodyVelocity(body, velocity, { requireAlreadyExists: !down })
    updateBodyAngularVelocity(body, angularVelocity, {
      requireAlreadyExists: !down,
    })
  }
}
