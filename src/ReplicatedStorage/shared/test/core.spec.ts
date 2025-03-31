/// <reference types="@rbxts/testez/globals" />

import { expect } from '@rbxts/expect'
import { INVENTORY, Step } from 'ReplicatedStorage/shared/constants/core'
import {
  decodeOffsetStep,
  encodeOffsetStep,
  getItemOutputOffsetStep,
  getItemVector3,
  getRotatedPoint,
  rotation0,
  rotation90,
  rotation180,
  rotation270,
} from 'ReplicatedStorage/shared/utils/core'

export = () => {
  describe('core', () => {
    it('should rotate points', () => {
      const rotation360 = new Vector3(0, 4, 0)
      const testPoint1 = new Vector3(0, 0, -1)
      const testPoint2 = new Vector3(1, 0, 0)
      const testPoint3 = new Vector3(0, 0, 1)
      const testPoint4 = new Vector3(-1, 0, 0)
      expect(getRotatedPoint(testPoint1, rotation0)).to.be.equal(testPoint1)
      expect(getRotatedPoint(testPoint1, rotation90)).to.be.equal(testPoint2)
      expect(getRotatedPoint(testPoint1, rotation180)).to.be.equal(testPoint3)
      expect(getRotatedPoint(testPoint1, rotation270)).to.be.equal(testPoint4)
      expect(getRotatedPoint(testPoint1, rotation360)).to.be.equal(testPoint1)
    })

    it('should encode offset steps', () => {
      {
        const offset = new Vector3(-33, 19, -41)
        const step = Step.Right
        expect(decodeOffsetStep(encodeOffsetStep(offset, step))).to.be.equal({
          offset,
          step,
        })
      }
      {
        const offset = new Vector3(13, 0, 22)
        const step = Step.Forward
        expect(decodeOffsetStep(encodeOffsetStep(offset, step))).to.be.equal({
          offset,
          step,
        })
      }
    })

    it('should get item output offset steps', () => {
      const containerOutputFrom = INVENTORY.Container.outputFrom
      if (!containerOutputFrom?.size())
        throw 'Container outputFrom is not defined'
      expect(containerOutputFrom[0]).to.be.equal([1, 0, -1])

      expect(
        getItemOutputOffsetStep(INVENTORY.Container, rotation0, 0),
      ).to.be.equal({
        offset: getItemVector3(containerOutputFrom[0]),
        step: Step.Forward,
      })

      expect(
        getItemOutputOffsetStep(INVENTORY.Container, rotation90, 0),
      ).to.be.equal({
        offset: new Vector3(1, 0, 1),
        step: Step.Right,
      })

      expect(
        getItemOutputOffsetStep(INVENTORY.Container, rotation180, 0),
      ).to.be.equal({
        offset: new Vector3(-1, 0, 1),
        step: Step.Backward,
      })

      expect(
        getItemOutputOffsetStep(INVENTORY.Container, rotation270, 0),
      ).to.be.equal({
        offset: new Vector3(-1, 0, -1),
        step: Step.Left,
      })
    })
  })
}
