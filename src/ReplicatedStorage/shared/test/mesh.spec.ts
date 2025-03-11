/// <reference types="@rbxts/testez/globals" />

import { expect } from '@rbxts/expect'
import { padEnd } from '@rbxts/string-utils'
import {
  coordinateEncodingLength,
  decodeMeshData,
  decodeMeshMidpoint,
  encodeMeshData,
  encodeMeshMidpoint,
  getMeshMidpointSizeFromStartpointEndpoint,
  getMeshStartpointEndpointFromMidpointSize,
  maxCoordinateValue,
} from 'ReplicatedStorage/shared/utils/mesh'

export = () => {
  describe('mesh', () => {
    it('should serialize midpoints', () => {
      const maxMidpoint = new Vector3(
        maxCoordinateValue,
        maxCoordinateValue,
        maxCoordinateValue,
      )
      const maxEncodedMidpoint = padEnd('', coordinateEncodingLength * 3, 'z')
      expect(encodeMeshMidpoint(maxMidpoint)).to.be.equal(maxEncodedMidpoint)
      expect(decodeMeshMidpoint(maxEncodedMidpoint)).to.be.equal(maxMidpoint)

      const minMidpoint = new Vector3(0, 0, 0)
      expect(decodeMeshMidpoint(encodeMeshMidpoint(minMidpoint))).to.be.equal(
        minMidpoint,
      )

      const testMidpoint1 = new Vector3(1321, 211, 2399)
      expect(decodeMeshMidpoint(encodeMeshMidpoint(testMidpoint1))).to.be.equal(
        testMidpoint1,
      )

      const testMidpoint2 = new Vector3(3, 0, 7)
      expect(decodeMeshMidpoint(encodeMeshMidpoint(testMidpoint2))).to.be.equal(
        testMidpoint2,
      )

      const testMidpoint3 = new Vector3(3344, 51, 1024)
      expect(decodeMeshMidpoint(encodeMeshMidpoint(testMidpoint3))).to.be.equal(
        testMidpoint3,
      )
    })

    it('should convert midpoint and size to startpoint and endpoint', () => {
      const testMidpoint1 = new Vector3(721, 444, 123)
      const size = new Vector3(3, 4, 5)
      const rotation = new Vector3(0, 0, 0)
      const { startpoint, endpoint } =
        getMeshStartpointEndpointFromMidpointSize(testMidpoint1, size, rotation)
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          startpoint,
          endpoint,
          rotation,
        ),
      ).to.be.equal({ midpoint: testMidpoint1, size })

      const size2 = new Vector3(6, 7, 8)
      const { startpoint: startpoint2, endpoint: endpoint2 } =
        getMeshStartpointEndpointFromMidpointSize(
          testMidpoint1,
          size2,
          rotation,
        )
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          startpoint2,
          endpoint2,
          rotation,
        ),
      ).to.be.equal({ midpoint: testMidpoint1, size: size2 })
    })

    it('should serialize mesh data', () => {
      const defaultBlock = {
        blockId: 1,
        width: 1,
        length: 1,
        height: 1,
        rotation: new Vector3(0, 0, 0),
      }
      expect(encodeMeshData(defaultBlock)).to.be.equal('2_')
      expect(decodeMeshData('2_')).to.be.equal(defaultBlock)
    })
  })
}
