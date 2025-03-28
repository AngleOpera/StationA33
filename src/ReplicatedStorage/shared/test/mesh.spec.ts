/// <reference types="@rbxts/testez/globals" />

import { expect } from '@rbxts/expect'
import Object from '@rbxts/object-utils'
import { Workspace } from '@rbxts/services'
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
  getCFrameFromMeshMidpoint,
  getMeshMidpointSizeFromStartpointEndpoint,
  getMeshOffsetsFromMeshMidpoint,
  getMeshRotationFromCFrame,
  getMeshStartpointEndpointFromMidpointSize,
  getRotatedMeshPoint,
  getRotatedMeshSize,
  maxCoordinateValue,
  MeshData,
  MeshMap,
  meshMapAdd,
  meshOffsetMapGet,
  MeshPlot,
  meshPlotAdd,
  meshPlotRemove,
  meshRotation0,
  meshRotation90,
  meshRotation180,
  meshRotation270,
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
      const rotation = meshRotation0
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
        rotation: meshRotation0,
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
      const rotation360 = new Vector3(0, 4, 0)
      const testPoint1 = new Vector3(0, 0, -1)
      const testPoint2 = new Vector3(1, 0, 0)
      const testPoint3 = new Vector3(0, 0, 1)
      const testPoint4 = new Vector3(-1, 0, 0)
      expect(getRotatedMeshPoint(testPoint1, meshRotation0)).to.be.equal(
        testPoint1,
      )
      expect(getRotatedMeshPoint(testPoint1, meshRotation90)).to.be.equal(
        testPoint2,
      )
      expect(getRotatedMeshPoint(testPoint1, meshRotation180)).to.be.equal(
        testPoint3,
      )
      expect(getRotatedMeshPoint(testPoint1, meshRotation270)).to.be.equal(
        testPoint4,
      )
      expect(getRotatedMeshPoint(testPoint1, rotation360)).to.be.equal(
        testPoint1,
      )
      const size1 = new Vector3(6, 1, 2)
      const size2 = new Vector3(2, 1, 6)
      expect(getRotatedMeshSize(size1, meshRotation0)).to.be.equal(size1)
      expect(getRotatedMeshSize(size1, meshRotation90)).to.be.equal(size2)
      expect(getRotatedMeshSize(size1, meshRotation180)).to.be.equal(size1)
      expect(getRotatedMeshSize(size1, meshRotation270)).to.be.equal(size2)
      expect(getRotatedMeshSize(size1, rotation360)).to.be.equal(size1)
    })
  })

  it('should find rotated offsets', () => {
    const item = INVENTORY.Conveyor
    const testPoint = new Vector3(39, 0, 422)
    expect(
      getMeshOffsetsFromMeshMidpoint(
        testPoint,
        getItemVector3(item.size),
        meshRotation0,
        item.outputTo ?? [],
      ),
    ).to.be.equal([new Vector3(39, 0, 421)])
    expect(
      getMeshOffsetsFromMeshMidpoint(
        testPoint,
        getItemVector3(item.size),
        meshRotation90,
        item.outputTo ?? [],
      ),
    ).to.be.equal([new Vector3(40, 0, 422)])
    expect(
      getMeshOffsetsFromMeshMidpoint(
        testPoint,
        getItemVector3(item.size),
        meshRotation180,
        item.outputTo ?? [],
      ),
    ).to.be.equal([new Vector3(39, 0, 423)])
    expect(
      getMeshOffsetsFromMeshMidpoint(
        testPoint,
        getItemVector3(item.size),
        meshRotation270,
        item.outputTo ?? [],
      ),
    ).to.be.equal([new Vector3(38, 0, 422)])

    const item2 = INVENTORY.Container
    const testPoint2 = new Vector3(39, 0, 422)
    expect(
      getMeshOffsetsFromMeshMidpoint(
        testPoint2,
        getItemVector3(item2.size),
        meshRotation0,
        item2.outputTo ?? [],
      ),
    ).to.be.equal([new Vector3(40, 0, 420)])
  })

  it('should find rotation for mesh relative to baseplate', () => {
    const baseplate = Workspace.Planet.Plot1
    const midpoint = new Vector3(3, 3, 3)
    const size = new Vector3(1, 1, 1)
    expect(
      getMeshRotationFromCFrame(
        getCFrameFromMeshMidpoint(midpoint, size, meshRotation0, baseplate),
        baseplate,
      ),
    ).to.be.equal(meshRotation0)
    expect(
      getMeshRotationFromCFrame(
        getCFrameFromMeshMidpoint(midpoint, size, meshRotation90, baseplate),
        baseplate,
      ),
    ).to.be.equal(meshRotation90)
    expect(
      getMeshRotationFromCFrame(
        getCFrameFromMeshMidpoint(midpoint, size, meshRotation180, baseplate),
        baseplate,
      ),
    ).to.be.equal(meshRotation180)
    expect(
      getMeshRotationFromCFrame(
        getCFrameFromMeshMidpoint(midpoint, size, meshRotation270, baseplate),
        baseplate,
      ),
    ).to.be.equal(meshRotation270)
  })

  it('should track mesh inputs and outputs', () => {
    const meshPlot: MeshPlot = {
      mesh: {},
      inputFrom: {},
      inputTo: {},
      outputTo: {},
    }
    const p = new Vector3(10, 0, 20)
    meshPlotAdd(meshPlot, p, INVENTORY.Conveyor, meshRotation90)
    expect(Object.keys(meshPlot.mesh).size()).to.be.equal(1)
    expect(Object.keys(meshPlot.inputFrom).size()).to.be.equal(1)
    expect(Object.keys(meshPlot.inputTo).size()).to.be.equal(1)
    expect(Object.keys(meshPlot.outputTo).size()).to.be.equal(1)
    let inputFrom = meshOffsetMapGet(meshPlot.inputFrom, new Vector3(9, 0, 20))
    let inputTo = meshOffsetMapGet(meshPlot.inputTo, new Vector3(10, 0, 20))
    let outputTo = meshOffsetMapGet(meshPlot.outputTo, new Vector3(11, 0, 20))
    expect(inputFrom?.size()).to.be.equal(1)
    expect(decodeMeshMidpoint(inputFrom[0])).to.be.equal(p)
    expect(inputTo?.size()).to.be.equal(1)
    expect(decodeMeshMidpoint(inputTo[0])).to.be.equal(p)
    expect(outputTo?.size()).to.be.equal(1)
    expect(decodeMeshMidpoint(outputTo[0])).to.be.equal(p)

    const q = new Vector3(11, 0, 20)
    meshPlotAdd(meshPlot, q, INVENTORY.Conveyor, meshRotation90)
    expect(Object.keys(meshPlot.mesh).size()).to.be.equal(2)
    expect(Object.keys(meshPlot.inputFrom).size()).to.be.equal(2)
    expect(Object.keys(meshPlot.inputTo).size()).to.be.equal(2)
    expect(Object.keys(meshPlot.outputTo).size()).to.be.equal(2)
    inputFrom = meshOffsetMapGet(meshPlot.inputFrom, new Vector3(10, 0, 20))
    inputTo = meshOffsetMapGet(meshPlot.inputTo, new Vector3(11, 0, 20))
    outputTo = meshOffsetMapGet(meshPlot.outputTo, new Vector3(12, 0, 20))
    expect(inputFrom?.size()).to.be.equal(1)
    expect(decodeMeshMidpoint(inputFrom[0])).to.be.equal(q)
    expect(inputTo?.size()).to.be.equal(1)
    expect(decodeMeshMidpoint(inputTo[0])).to.be.equal(q)
    expect(outputTo?.size()).to.be.equal(1)
    expect(decodeMeshMidpoint(outputTo[0])).to.be.equal(q)

    const r = new Vector3(9, 0, 19)
    meshPlotAdd(meshPlot, r, INVENTORY.Conveyor, meshRotation0)
    expect(Object.keys(meshPlot.mesh).size()).to.be.equal(3)
    expect(Object.keys(meshPlot.inputFrom).size()).to.be.equal(2)
    expect(Object.keys(meshPlot.inputTo).size()).to.be.equal(3)
    expect(Object.keys(meshPlot.outputTo).size()).to.be.equal(3)
    inputFrom = meshOffsetMapGet(meshPlot.inputFrom, new Vector3(9, 0, 20))
    inputTo = meshOffsetMapGet(meshPlot.inputTo, new Vector3(9, 0, 19))
    outputTo = meshOffsetMapGet(meshPlot.outputTo, new Vector3(9, 0, 18))
    expect(inputFrom?.size()).to.be.equal(2)
    expect(decodeMeshMidpoint(inputFrom[0])).to.be.equal(r)
    expect(decodeMeshMidpoint(inputFrom[1])).to.be.equal(p)
    expect(inputTo?.size()).to.be.equal(1)
    expect(decodeMeshMidpoint(inputTo[0])).to.be.equal(r)
    expect(outputTo?.size()).to.be.equal(1)
    expect(decodeMeshMidpoint(outputTo[0])).to.be.equal(r)

    meshPlotRemove(meshPlot, p, INVENTORY.Conveyor, meshRotation90)
    expect(Object.keys(meshPlot.mesh).size()).to.be.equal(2)
    expect(Object.keys(meshPlot.inputFrom).size()).to.be.equal(2)
    expect(Object.keys(meshPlot.inputTo).size()).to.be.equal(2)
    expect(Object.keys(meshPlot.outputTo).size()).to.be.equal(2)
    inputFrom = meshOffsetMapGet(meshPlot.inputFrom, new Vector3(9, 0, 20))
    expect(inputFrom?.size()).to.be.equal(1)
    expect(decodeMeshMidpoint(inputFrom[0])).to.be.equal(r)
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
