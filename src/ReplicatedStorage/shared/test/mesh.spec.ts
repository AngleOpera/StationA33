/// <reference types="@rbxts/testez/globals" />

import { expect } from '@rbxts/expect'
import { padEnd } from '@rbxts/string-utils'
import { base58ColumnValues } from 'ReplicatedStorage/shared/utils/base58'
import {
  coordinateEncodingLength,
  decodeMeshMidPoint,
  encodeMeshMidPoint,
  getMeshMidpointSizeFromStartpointEndpoint,
  getMeshStartpointEndpointFromMidpointSize,
} from 'ReplicatedStorage/shared/utils/mesh'

export = () => {
  describe('mesh', () => {
    it('should serialize midpoints', () => {
      const maxEncodedCoordinate =
        base58ColumnValues[coordinateEncodingLength] - 1
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

    it('should convert midpoint and size to startpoint and endpoint', () => {
      const testMidPoint1 = new Vector3(721, 444, 123)
      const size = new Vector3(3, 4, 5)
      const rotation = new Vector3(0, 0, 0)
      const { startPoint, endPoint } =
        getMeshStartpointEndpointFromMidpointSize(testMidPoint1, size, rotation)
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          startPoint,
          endPoint,
          rotation,
        ),
      ).to.be.equal({ midpoint: testMidPoint1, size })

      const size2 = new Vector3(6, 7, 8)
      const { startPoint: startPoint2, endPoint: endPoint2 } =
        getMeshStartpointEndpointFromMidpointSize(
          testMidPoint1,
          size2,
          rotation,
        )
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          startPoint2,
          endPoint2,
          rotation,
        ),
      ).to.be.equal({ midpoint: testMidPoint1, size: size2 })
    })
  })
}
