/// <reference types="@rbxts/testez/globals" />

import { expect } from '@rbxts/expect'
import { padEnd } from '@rbxts/string-utils'
import {
  coordinateEncodingLength,
  decodeMeshMidPoint,
  encodeMeshMidPoint,
  maxEncodedCoordinate,
} from 'ReplicatedStorage/shared/utils/mesh'

export = () => {
  describe('mesh', () => {
    it('should serialize midpoints', () => {
      const maxMidPoint = new Vector3(
        maxEncodedCoordinate,
        maxEncodedCoordinate,
        maxEncodedCoordinate,
      )
      const maxEncodedMidPoint = padEnd('', coordinateEncodingLength * 3, 'z')
      expect(encodeMeshMidPoint(maxMidPoint)).to.be.equal(maxEncodedMidPoint)
      expect(decodeMeshMidPoint(maxEncodedMidPoint)).to.be.equal(maxMidPoint)

      const minMidPoint = new Vector3(0, 0, 0)
      expect(decodeMeshMidPoint(encodeMeshMidPoint(minMidPoint))).to.be.equal(
        minMidPoint,
      )

      const testMidPoint1 = new Vector3(1321, 211, 2399)
      expect(decodeMeshMidPoint(encodeMeshMidPoint(testMidPoint1))).to.be.equal(
        testMidPoint1,
      )

      const testMidPoint2 = new Vector3(3, 0, 7)
      expect(decodeMeshMidPoint(encodeMeshMidPoint(testMidPoint2))).to.be.equal(
        testMidPoint2,
      )

      const testMidPoint3 = new Vector3(3344, 51, 1024)
      expect(decodeMeshMidPoint(encodeMeshMidPoint(testMidPoint3))).to.be.equal(
        testMidPoint3,
      )
    })
  })
}
