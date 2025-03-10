/// <reference types="@rbxts/testez/globals" />

import { expect } from '@rbxts/expect'
import {
  base58ToInt,
  decodeBase58Array,
  intToBase58,
} from 'ReplicatedStorage/shared/utils/base58'

export = () => {
  describe('base58', () => {
    it('should serialize integers', () => {
      expect(intToBase58(0)).to.be.equal('1')
      expect(intToBase58(58 * 58 - 1)).to.be.equal('zz')
    })

    it('should deserialize base58', () => {
      expect(base58ToInt('1')).to.be.equal(0)
      expect(base58ToInt('zz')).to.be.equal(58 * 58 - 1)
    })

    it('should deserialize empty string as expected number of zeros', () => {
      expect(base58ToInt('')).to.be.equal(0)
      expect(decodeBase58Array('', 3, 2)).to.be.equal([0, 0, 0])
      expect(decodeBase58Array('zz', 5, 2)).to.be.equal([
        58 * 58 - 1,
        0,
        0,
        0,
        0,
      ])
    })
  })
}
