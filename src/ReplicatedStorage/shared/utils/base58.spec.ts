/// <reference types="@rbxts/testez/globals" />

import { expect } from '@rbxts/expect'

export = () => {
  describe('empty', () => {
    it('checks if arrays have any elements', () => {
      expect([]).to.be.empty()
      expect([1]).to.not.be.empty()
    })
  })
}
