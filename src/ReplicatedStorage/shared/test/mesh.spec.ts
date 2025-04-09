/// <reference types="@rbxts/testez/globals" />

import { expect } from '@rbxts/expect'
import Object from '@rbxts/object-utils'
import { Workspace } from '@rbxts/services'
import { padEnd } from '@rbxts/string-utils'
import { INVENTORY } from 'ReplicatedStorage/shared/constants/core'
import {
  getOffsetsFromMidpoint,
  rotation0,
  rotation90,
  rotation180,
  rotation270,
} from 'ReplicatedStorage/shared/utils/core'
import {
  coordinateEncodingLength,
  decodeMeshData,
  decodeMeshMidpoint,
  doGreedyMeshing,
  encodeMeshData,
  encodeMeshMidpoint,
  getCFrameFromMeshMidpoint,
  getMeshMidpointSizeFromStartpointEndpoint,
  getMeshRotationFromBaseplate,
  getMeshStartpointEndpointFromMidpointSize,
  maxCoordinateValue,
  MeshData,
  MeshMap,
  meshMapAdd,
  meshOffsetMapGet,
  MeshPlot,
  meshPlotAdd,
  meshPlotRemove,
} from 'ReplicatedStorage/shared/utils/mesh'

/* Container

r0:            r90:           r180           r270:

o = (1, -2)    o = (2, 1)     o = (-1, 2)    o = (-2,-1)
i = (0, 2)     i = (-2, 0)    i = (-2, 0)    i = (2, 0)

                    o                             i
   oaaa            aa            iama            aa
    amai           ma             aaao           am
                   aa                            aa
                   i                             o
*/

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
          rotation0,
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
          rotation0,
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
          rotation0,
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
          rotation0,
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
          rotation0,
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
          rotation0,
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
          rotation0,
        ),
      ).to.be.equal({
        startpoint: new Vector3(0, 0, 0),
        endpoint: new Vector3(3, 1, 3),
      })
    })

    it('should convert between (midpoint, size) and (startpoint, endpoint)', () => {
      const size = new Vector3(3, 4, 5)
      const rotation = rotation0
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
        rotation: rotation0,
      }
      expect(encodeMeshData(defaultBlock)).to.be.equal('2_')
      expect(decodeMeshData('2_')).to.be.equal(defaultBlock)
    })

    it('should convert rotated (midpoint, size) to (startpoint, endpoint)', () => {
      // Midpoint: (39, 0, 422), Size: (2, 2, 3)
      expect(
        getMeshStartpointEndpointFromMidpointSize(
          new Vector3(39, 0, 422),
          new Vector3(2, 2, 3),
          rotation0,
        ),
      ).to.be.equal({
        startpoint: new Vector3(39, 0, 421),
        endpoint: new Vector3(40, 1, 423),
      })
      expect(
        getMeshStartpointEndpointFromMidpointSize(
          new Vector3(39, 0, 422),
          new Vector3(2, 2, 3),
          rotation90,
        ),
      ).to.be.equal({
        startpoint: new Vector3(38, 0, 422),
        endpoint: new Vector3(40, 1, 423),
      })
      expect(
        getMeshStartpointEndpointFromMidpointSize(
          new Vector3(39, 0, 422),
          new Vector3(2, 2, 3),
          rotation180,
        ),
      ).to.be.equal({
        startpoint: new Vector3(38, 0, 421),
        endpoint: new Vector3(39, 1, 423),
      })
      expect(
        getMeshStartpointEndpointFromMidpointSize(
          new Vector3(39, 0, 422),
          new Vector3(2, 2, 3),
          rotation270,
        ),
      ).to.be.equal({
        startpoint: new Vector3(38, 0, 421),
        endpoint: new Vector3(40, 1, 422),
      })
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
          rotation0,
        ),
      ).to.be.equal({
        midpoint: new Vector3(5, 0, 5),
        size: new Vector3(3, 1, 1),
      })
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          new Vector3(6, 0, 5),
          new Vector3(4, 0, 5),
          rotation90,
        ),
      ).to.be.equal({
        midpoint: new Vector3(5, 0, 5),
        size: new Vector3(3, 1, 1),
      })
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          new Vector3(6, 0, 5),
          new Vector3(4, 0, 5),
          rotation180,
        ),
      ).to.be.equal({
        midpoint: new Vector3(5, 0, 5),
        size: new Vector3(3, 1, 1),
      })
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          new Vector3(5, 0, 4),
          new Vector3(5, 0, 6),
          rotation90,
        ),
      ).to.be.equal({
        midpoint: new Vector3(5, 0, 5),
        size: new Vector3(1, 1, 3),
      })

      // Midpoint: (39, 0, 422), Size: (2, 2, 3)
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          new Vector3(39, 0, 421),
          new Vector3(40, 1, 423),
          rotation0,
        ),
      ).to.be.equal({
        midpoint: new Vector3(39, 0, 422),
        size: new Vector3(2, 2, 3),
      })
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          new Vector3(40, 1, 423),
          new Vector3(39, 0, 421),
          rotation0,
        ),
      ).to.be.equal({
        midpoint: new Vector3(39, 0, 422),
        size: new Vector3(2, 2, 3),
      })

      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          new Vector3(40, 1, 423),
          new Vector3(38, 0, 422),
          rotation90,
        ),
      ).to.be.equal({
        midpoint: new Vector3(39, 0, 422),
        size: new Vector3(3, 2, 2),
      })
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          new Vector3(38, 0, 422),
          new Vector3(40, 1, 423),
          rotation90,
        ),
      ).to.be.equal({
        midpoint: new Vector3(39, 0, 422),
        size: new Vector3(3, 2, 2),
      })

      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          new Vector3(39, 1, 423),
          new Vector3(38, 0, 421),
          rotation180,
        ),
      ).to.be.equal({
        midpoint: new Vector3(39, 0, 422),
        size: new Vector3(2, 2, 3),
      })
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          new Vector3(38, 0, 421),
          new Vector3(39, 1, 423),
          rotation180,
        ),
      ).to.be.equal({
        midpoint: new Vector3(39, 0, 422),
        size: new Vector3(2, 2, 3),
      })

      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          new Vector3(40, 1, 422),
          new Vector3(38, 0, 421),
          rotation270,
        ),
      ).to.be.equal({
        midpoint: new Vector3(39, 0, 422),
        size: new Vector3(3, 2, 2),
      })
      expect(
        getMeshMidpointSizeFromStartpointEndpoint(
          new Vector3(38, 0, 421),
          new Vector3(40, 1, 422),
          rotation270,
        ),
      ).to.be.equal({
        midpoint: new Vector3(39, 0, 422),
        size: new Vector3(3, 2, 2),
      })
    })
  })

  it('should find rotated offsets', () => {
    const item = INVENTORY.Conveyor
    const testPoint = new Vector3(39, 0, 422)
    expect(
      getOffsetsFromMidpoint(testPoint, rotation0, item.outputTo ?? []),
    ).to.be.equal([new Vector3(39, 0, 421)])
    expect(
      getOffsetsFromMidpoint(testPoint, rotation90, item.outputTo ?? []),
    ).to.be.equal([new Vector3(40, 0, 422)])
    expect(
      getOffsetsFromMidpoint(testPoint, rotation180, item.outputTo ?? []),
    ).to.be.equal([new Vector3(39, 0, 423)])
    expect(
      getOffsetsFromMidpoint(testPoint, rotation270, item.outputTo ?? []),
    ).to.be.equal([new Vector3(38, 0, 422)])

    const item2 = INVENTORY.Container
    expect(
      getOffsetsFromMidpoint(testPoint, rotation0, item2.outputTo ?? []),
    ).to.be.equal([testPoint.add(new Vector3(1, 0, -2))])
    expect(
      getOffsetsFromMidpoint(testPoint, rotation90, item2.outputTo ?? []),
    ).to.be.equal([testPoint.add(new Vector3(2, 0, 1))])
    expect(
      getOffsetsFromMidpoint(testPoint, rotation180, item2.outputTo ?? []),
    ).to.be.equal([testPoint.add(new Vector3(-1, 0, 2))])
    expect(
      getOffsetsFromMidpoint(testPoint, rotation270, item2.outputTo ?? []),
    ).to.be.equal([testPoint.add(new Vector3(-2, 0, -1))])
  })

  it('should find rotation for mesh relative to baseplate', () => {
    const baseplate = Workspace.Planet.Plot1
    const midpoint = new Vector3(3, 3, 3)
    const size = new Vector3(1, 1, 1)
    expect(
      getMeshRotationFromBaseplate(
        getCFrameFromMeshMidpoint(midpoint, size, rotation0, baseplate),
        baseplate,
      ),
    ).to.be.equal(rotation0)
    expect(
      getMeshRotationFromBaseplate(
        getCFrameFromMeshMidpoint(midpoint, size, rotation90, baseplate),
        baseplate,
      ),
    ).to.be.equal(rotation90)
    expect(
      getMeshRotationFromBaseplate(
        getCFrameFromMeshMidpoint(midpoint, size, rotation180, baseplate),
        baseplate,
      ),
    ).to.be.equal(rotation180)
    expect(
      getMeshRotationFromBaseplate(
        getCFrameFromMeshMidpoint(midpoint, size, rotation270, baseplate),
        baseplate,
      ),
    ).to.be.equal(rotation270)
  })

  it('should track mesh inputs and outputs', () => {
    const meshPlot: MeshPlot = {
      userId: 0,
      mesh: {},
      inputFrom: {},
      inputTo: {},
      outputTo: {},
      entity: {},
    }
    const p = new Vector3(10, 0, 20)
    meshPlotAdd(meshPlot, p, rotation90, INVENTORY.Conveyor)
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
    meshPlotAdd(meshPlot, q, rotation90, INVENTORY.Conveyor)
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
    meshPlotAdd(meshPlot, r, rotation0, INVENTORY.Conveyor)
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

    meshPlotRemove(meshPlot, p, rotation90, INVENTORY.Conveyor)
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
