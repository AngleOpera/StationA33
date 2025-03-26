/// <reference types="@rbxts/testez/globals" />

import { expect } from '@rbxts/expect'
import { selectPlayerState } from 'ReplicatedStorage/shared/state'
import { store } from 'ServerScriptService/store'

export = () => {
  describe('state', () => {
    const testUserId = 1
    const testPlayerName = 'Player 1'
    const selectTestPlayer = selectPlayerState(testUserId)

    beforeAll(() => {
      store.closePlayerData(testUserId)
    })

    it('should load player data', () => {
      const state = store.loadPlayerData(testUserId, testPlayerName)
      const playerState = selectTestPlayer(state)
      expect(playerState?.name).to.equal(testPlayerName)
    })

    it('should update player currency', () => {
      const delta = 100
      const state = store.updatePlayerCurrency(testUserId, 'Credits', delta)
      const playerState = selectTestPlayer(state)
      expect(playerState?.credits).to.equal(delta)
    })

    it('should update player inventory', () => {
      const state = store.updatePlayerInventory(testUserId, 'Conveyor', 13)
      const playerState = selectTestPlayer(state)
      expect(playerState?.inventory.Conveyor).to.equal(13)
    })

    it('should move from player inventory and container', () => {
      const state = store.moveFromPlayerContainerToInventory(
        testUserId,
        'foobar',
        'Conveyor',
        -11,
      )
      const playerState = selectTestPlayer(state)
      expect(playerState?.inventory?.Conveyor).to.equal(2)
      expect(playerState?.containers?.foobar?.Conveyor).to.equal(11)

      const state2 = store.moveFromPlayerContainerToInventory(
        testUserId,
        'foobar',
        'Conveyor',
        9,
      )
      const playerState2 = selectTestPlayer(state2)
      expect(playerState2?.inventory?.Conveyor).to.equal(11)
      expect(playerState2?.containers?.foobar?.Conveyor).to.equal(2)

      expect(
        selectTestPlayer(
          store.moveFromPlayerContainerToInventory(
            testUserId,
            'foobar',
            'Conveyor',
            -20,
          ),
        ),
      ).to.equal(playerState2)

      expect(
        selectTestPlayer(
          store.moveFromPlayerContainerToInventory(
            testUserId,
            'foobar',
            'Conveyor',
            20,
          ),
        ),
      ).to.equal(playerState2)

      const state3 = store.breakPlayerContainer(testUserId, 'foobar')
      const playerState3 = selectTestPlayer(state3)
      expect(playerState3?.inventory?.Conveyor).to.equal(13)
      expect(playerState3?.containers?.foobar).to.equal(undefined)
    })

    it('should unload player data', () => {
      expect(selectTestPlayer(store.getState())?.name).to.equal(testPlayerName)
      store.closePlayerData(testUserId)
      expect(selectTestPlayer(store.getState())).to.equal(undefined)
    })
  })
}
