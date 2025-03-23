/// <reference types="@rbxts/testez/globals" />

import { expect } from '@rbxts/expect'
import {
  compareNumber,
  sarrayAdd,
  sarrayFind,
  sarrayRemove,
} from 'ReplicatedStorage/shared/utils/sarray'

export = () => {
  describe('sarray', () => {
    it('should maintain sorted array of numbers', () => {
      const arr: number[] = []

      // Test adding to sarray
      sarrayAdd(arr, 7, compareNumber)
      expect(arr).to.equal([7])
      sarrayAdd(arr, 37, compareNumber)
      expect(arr).to.equal([7, 37])
      sarrayAdd(arr, 3, compareNumber)
      expect(arr).to.equal([3, 7, 37])
      sarrayAdd(arr, 99, compareNumber)
      expect(arr).to.equal([3, 7, 37, 99])
      sarrayAdd(arr, 1, compareNumber)
      expect(arr).to.equal([1, 3, 7, 37, 99])

      // Test finding in sarray
      expect(sarrayFind(arr, 1, compareNumber)).to.equal(0)
      expect(sarrayFind(arr, 3, compareNumber)).to.equal(1)
      expect(sarrayFind(arr, 7, compareNumber)).to.equal(2)
      expect(sarrayFind(arr, 37, compareNumber)).to.equal(3)
      expect(sarrayFind(arr, 99, compareNumber)).to.equal(4)

      expect(sarrayFind(arr, 0, compareNumber)).to.equal(-1)
      expect(sarrayFind(arr, 2, compareNumber)).to.equal(-1)
      expect(sarrayFind(arr, 4, compareNumber)).to.equal(-1)
      expect(sarrayFind(arr, 100, compareNumber)).to.equal(-1)

      // Test removing from sarray
      sarrayRemove(arr, 7, compareNumber)
      expect(arr).to.equal([1, 3, 37, 99])
      sarrayRemove(arr, 1, compareNumber)
      expect(arr).to.equal([3, 37, 99])
      sarrayRemove(arr, 99, compareNumber)
      expect(arr).to.equal([3, 37])
      sarrayRemove(arr, 3, compareNumber)
      expect(arr).to.equal([37])
      sarrayRemove(arr, 37, compareNumber)
      expect(arr).to.equal([])
    })
  })
}
