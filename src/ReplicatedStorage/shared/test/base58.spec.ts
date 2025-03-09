/// <reference types="@rbxts/testez/globals" />

import { expect } from '@rbxts/expect'
import { base58ToInt, intToBase58 } from 'ReplicatedStorage/shared/utils/base58'

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
  })
}
