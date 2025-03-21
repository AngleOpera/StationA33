/// <reference types="@rbxts/testez/globals" />

import { expect } from '@rbxts/expect'
import Object from '@rbxts/object-utils'
import { padEnd } from '@rbxts/string-utils'
import { INVENTORY } from 'ReplicatedStorage/shared/constants/core'
import { getItemVector3 } from 'ReplicatedStorage/shared/utils/core'
import {
  coordinateEncodingLength,
  decodeMeshData,
  decodeMeshMidpoint,
  doGreedyMeshing,
  encodeMeshData,
  encodeMeshMidpoint,
  getMeshMidpointSizeFromStartpointEndpoint,
  getMeshOffsetsFromMeshMidpoint,
  getMeshStartpointEndpointFromMidpointSize,
  getRotatedMeshPoint,
  getRotatedMeshSize,
  maxCoordinateValue,
  MeshData,
  MeshMap,
  meshMapAdd,
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

    it('should convert (startpoint, endpoint) to (midpoint, size)', () => {
      // Midpoint: (0, 0, 0), Size: (1, 1, 1)
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          new Vector3(0, 0, 0),
          new Vector3(0, 0, 0),
          new Vector3(0, 0, 0),
        ),
      ).to.be.equal({
        midpoint: new Vector3(0, 0, 0),
        size: new Vector3(1, 1, 1),
      })

      // Midpoint: (0, 0, 0), Size: (2, 2, 2)
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          new Vector3(0, 0, 0),
          new Vector3(1, 1, 1),
          new Vector3(0, 0, 0),
        ),
      ).to.be.equal({
        midpoint: new Vector3(0, 0, 0),
        size: new Vector3(2, 2, 2),
      })

      // Midpoint: (1, 0, 1), Size: (3, 1, 3)
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          new Vector3(0, 0, 0),
          new Vector3(2, 0, 2),
          new Vector3(0, 0, 0),
        ),
      ).to.be.equal({
        midpoint: new Vector3(1, 0, 1),
        size: new Vector3(3, 1, 3),
      })

      // Midpoint: (1, 0, 1), Size: (4, 2, 4)
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          new Vector3(0, 0, 0),
          new Vector3(3, 1, 3),
          new Vector3(0, 0, 0),
        ),
      ).to.be.equal({
        midpoint: new Vector3(1, 0, 1),
        size: new Vector3(4, 2, 4),
      })
    })

    it('should convert (midpoint, size) to (startpoint, endpoint)', () => {
      // Midpoint: (0, 0, 0), Size: (1, 1, 1)
      expect(
        getMeshStartpointEndpointFromMidpointSize(
          new Vector3(0, 0, 0),
          new Vector3(1, 1, 1),
          new Vector3(0, 0, 0),
        ),
      ).to.be.equal({
        startpoint: new Vector3(0, 0, 0),
        endpoint: new Vector3(0, 0, 0),
      })

      // Midpoint: (0, 0, 0), Size: (2, 2, 2)
      expect(
        getMeshStartpointEndpointFromMidpointSize(
          new Vector3(0, 0, 0),
          new Vector3(2, 2, 2),
          new Vector3(0, 0, 0),
        ),
      ).to.be.equal({
        startpoint: new Vector3(0, 0, 0),
        endpoint: new Vector3(1, 1, 1),
      })

      // Midpoint: (1, 0, 1), Size: (3, 1, 3)
      expect(
        getMeshStartpointEndpointFromMidpointSize(
          new Vector3(1, 0, 1),
          new Vector3(3, 1, 3),
          new Vector3(0, 0, 0),
        ),
      ).to.be.equal({
        startpoint: new Vector3(0, 0, 0),
        endpoint: new Vector3(2, 0, 2),
      })

      // Midpoint: (1, 0, 1), Size: (4, 2, 4)
      expect(
        getMeshStartpointEndpointFromMidpointSize(
          new Vector3(1, 0, 1),
          new Vector3(4, 2, 4),
          new Vector3(0, 0, 0),
        ),
      ).to.be.equal({
        startpoint: new Vector3(0, 0, 0),
        endpoint: new Vector3(3, 1, 3),
      })
    })

    it('should convert between (midpoint, size) and (startpoint, endpoint)', () => {
      const size = new Vector3(3, 4, 5)
      const rotation = new Vector3(0, 0, 0)
      const testMidpoint1 = new Vector3(721, 444, 123)
      const { startpoint, endpoint } =
        getMeshStartpointEndpointFromMidpointSize(testMidpoint1, size, rotation)
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          startpoint,
          endpoint,
          rotation,
        ),
      ).to.be.equal({ midpoint: testMidpoint1, size })
      expect(startpoint).to.be.equal(new Vector3(720, 443, 121))
      expect(endpoint).to.be.equal(new Vector3(722, 446, 125))

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
      expect(startpoint2).to.be.equal(new Vector3(719, 441, 120))
      expect(endpoint2).to.be.equal(new Vector3(724, 447, 127))

      const size3 = new Vector3(1, 1, 1)
      const { startpoint: startpoint3, endpoint: endpoint3 } =
        getMeshStartpointEndpointFromMidpointSize(
          testMidpoint1,
          size3,
          rotation,
        )
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          startpoint3,
          endpoint3,
          rotation,
        ),
      ).to.be.equal({ midpoint: testMidpoint1, size: size3 })
      expect(startpoint3).to.be.equal(testMidpoint1)
      expect(endpoint3).to.be.equal(testMidpoint1)
    })

    it('should serialize mesh data', () => {
      const defaultBlock = {
        blockId: 1,
        size: new Vector3(1, 1, 1),
        rotation: new Vector3(0, 0, 0),
      }
      expect(encodeMeshData(defaultBlock)).to.be.equal('2_')
      expect(decodeMeshData('2_')).to.be.equal(defaultBlock)
    })

    it('should convert rotated (startpoint, endpoint) to (midpoint, size)', () => {
      // Midpoint: (0, 0, 0), Size: (1, 1, 1)
      for (let i = 0; i < 4; i++) {
        expect(
          getMeshMidpointSizeFromStartpointEndpoint(
            new Vector3(0, 0, 0),
            new Vector3(0, 0, 0),
            new Vector3(0, i, 0),
          ),
        ).to.be.equal({
          midpoint: new Vector3(0, 0, 0),
          size: new Vector3(1, 1, 1),
        })
      }

      // Midpoint: (5, 0, 5), Size: (3, 1, 1)
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          new Vector3(6, 0, 5),
          new Vector3(4, 0, 5),
          new Vector3(0, 0, 0),
        ),
      ).to.be.equal({
        midpoint: new Vector3(5, 0, 5),
        size: new Vector3(3, 1, 1),
      })
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          new Vector3(6, 0, 5),
          new Vector3(4, 0, 5),
          new Vector3(0, 1, 0),
        ),
      ).to.be.equal({
        midpoint: new Vector3(5, 0, 5),
        size: new Vector3(1, 1, 3),
      })
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          new Vector3(6, 0, 5),
          new Vector3(4, 0, 5),
          new Vector3(0, 2, 0),
        ),
      ).to.be.equal({
        midpoint: new Vector3(5, 0, 5),
        size: new Vector3(3, 1, 1),
      })
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          new Vector3(5, 0, 4),
          new Vector3(5, 0, 6),
          new Vector3(0, 1, 0),
        ),
      ).to.be.equal({
        midpoint: new Vector3(5, 0, 5),
        size: new Vector3(3, 1, 1),
      })
    })

    it('should rotate mesh points', () => {
      const rotation0 = new Vector3(0, 0, 0)
      const rotation1 = new Vector3(0, 1, 0)
      const rotation2 = new Vector3(0, 2, 0)
      const rotation3 = new Vector3(0, 3, 0)
      const rotation4 = new Vector3(0, 4, 0)
      const testPoint1 = new Vector3(0, 0, -1)
      const testPoint2 = new Vector3(1, 0, 0)
      const testPoint3 = new Vector3(0, 0, 1)
      const testPoint4 = new Vector3(-1, 0, 0)
      expect(getRotatedMeshPoint(testPoint1, rotation0)).to.be.equal(testPoint1)
      expect(getRotatedMeshPoint(testPoint1, rotation1)).to.be.equal(testPoint2)
      expect(getRotatedMeshPoint(testPoint1, rotation2)).to.be.equal(testPoint3)
      expect(getRotatedMeshPoint(testPoint1, rotation3)).to.be.equal(testPoint4)
      expect(getRotatedMeshPoint(testPoint1, rotation4)).to.be.equal(testPoint1)
      const size1 = new Vector3(6, 1, 2)
      const size2 = new Vector3(2, 1, 6)
      expect(getRotatedMeshSize(size1, rotation0)).to.be.equal(size1)
      expect(getRotatedMeshSize(size1, rotation1)).to.be.equal(size2)
      expect(getRotatedMeshSize(size1, rotation2)).to.be.equal(size1)
      expect(getRotatedMeshSize(size1, rotation3)).to.be.equal(size2)
      expect(getRotatedMeshSize(size1, rotation4)).to.be.equal(size1)
    })
  })

  it('should find rotated offsets', () => {
    const item = INVENTORY.Conveyor
    const testPoint = new Vector3(39, 0, 422)
    expect(
      getMeshOffsetsFromMeshMidpoint(
        testPoint,
        getItemVector3(item.size),
        new Vector3(0, 0, 0),
        item.output ?? [],
      ),
    ).to.be.equal([new Vector3(39, 0, 421)])
    expect(
      getMeshOffsetsFromMeshMidpoint(
        testPoint,
        getItemVector3(item.size),
        new Vector3(0, 1, 0),
        item.output ?? [],
      ),
    ).to.be.equal([new Vector3(40, 0, 422)])
    expect(
      getMeshOffsetsFromMeshMidpoint(
        testPoint,
        getItemVector3(item.size),
        new Vector3(0, 2, 0),
        item.output ?? [],
      ),
    ).to.be.equal([new Vector3(39, 0, 423)])
    expect(
      getMeshOffsetsFromMeshMidpoint(
        testPoint,
        getItemVector3(item.size),
        new Vector3(0, 3, 0),
        item.output ?? [],
      ),
    ).to.be.equal([new Vector3(38, 0, 422)])
  })

  it('should do greedy meshing', () => {
    const meshData: MeshData = {
      blockId: 1,
      size: new Vector3(1, 1, 1),
      rotation: new Vector3(0, 0, 0),
    }
    const world: MeshMap = {}
    meshMapAdd(world, new Vector3(33, 0, 11), { ...meshData })
    meshMapAdd(world, new Vector3(33, 0, 12), { ...meshData })
    meshMapAdd(world, new Vector3(33, 0, 13), { ...meshData })
    meshMapAdd(world, new Vector3(33, 0, 14), { ...meshData })
    meshMapAdd(world, new Vector3(34, 0, 11), { ...meshData })
    meshMapAdd(world, new Vector3(34, 0, 12), { ...meshData })
    meshMapAdd(world, new Vector3(34, 0, 13), { ...meshData })
    meshMapAdd(world, new Vector3(34, 0, 14), { ...meshData })

    const expanded = doGreedyMeshing(doGreedyMeshing({ ...world }, 'z'), 'x')
    expect(Object.keys(expanded).size()).to.be.equal(1)
    const [encodedMidpoint, encodedData] = Object.entries(expanded)[0]
    const midpoint = decodeMeshMidpoint(encodedMidpoint)
    const data = decodeMeshData(encodedData)
    expect(midpoint).to.be.equal(new Vector3(33, 0, 12))
    expect(data).to.be.equal({
      blockId: meshData.blockId,
      size: new Vector3(2, 1, 4),
      rotation: meshData.rotation,
    })
    expect(
      getMeshStartpointEndpointFromMidpointSize(
        midpoint,
        data.size,
        data.rotation,
      ),
    ).to.be.equal({
      startpoint: new Vector3(33, 0, 11),
      endpoint: new Vector3(34, 0, 14),
    })
  })
}
