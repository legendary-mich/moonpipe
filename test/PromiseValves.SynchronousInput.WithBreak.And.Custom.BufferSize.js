'use strict'

const { expect } = require('chai')
const { MudPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected, settingsOverride) {
  const results = []
  const pipe = new MudPipe()[method](async (value) => {
    results.push('side_' + value)
    await delayPromise(1)
    return value + 100
  }, settingsOverride)
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .handleError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })

  pipe.pump(1)
  pipe.pump(2)

  await delayPromise(16)

  pipe.pump(3)
  pipe.pump(4)

  await delayPromise(16)

  expect(results).to.eql(expected)
}

describe('PromiseValves with Synchronous input.', () => {

  describe('MudPipe.queueTap', () => {
    it('pumps ORIGINAL values', () => {
      return testInput('queueTap', [
        'side_1',
        'res_1',
        'side_2',
        'res_2',
        'side_3',
        'res_3',
        'side_4',
        'res_4',
      ], {
        maxBufferSize: 2, // testing the numberOfReservedSlots-- line
      })
    })
  })

  describe('MudPipe.queueMap', () => {
    it('pumps MODIFIED values', () => {
      return testInput('queueMap', [
        'side_1',
        'res_101',
        'side_2',
        'res_102',
        'side_3',
        'res_103',
        'side_4',
        'res_104',
      ], {
        maxBufferSize: 2, // testing the numberOfReservedSlots-- line
      })
    })
  })

  describe('MudPipe.cancelTap', () => {
    it('cancels initial promises, and resolves the last one with the ORIGINAL value', () => {
      return testInput('cancelTap', [
        'side_1',
        'side_2',
        'res_2',
        'side_3',
        'side_4',
        'res_4',
      ], {
        maxBufferSize: 2, // testing the numberOfReservedSlots-- line
      })
    })
  })

  describe('MudPipe.cancelMap', () => {
    it('cancels initial promises, and resolves the last one with a MODIFIED value', () => {
      return testInput('cancelMap', [
        'side_1',
        'side_2',
        'res_102',
        'side_3',
        'side_4',
        'res_104',
      ], {
        maxBufferSize: 2, // testing the numberOfReservedSlots-- line
      })
    })
  })

  describe('MudPipe.throttleTap', () => {
    it('removes values which are waiting in the queue, and pumps ORIGINAL ones', () => {
      return testInput('throttleTap', [
        'side_2',
        'res_2',
        'side_4',
        'res_4',
      ], {
        maxBufferSize: 1, // testing the numberOfReservedSlots-- line
      })
    })
  })

  describe('MudPipe.throttleMap', () => {
    it('removes values which are waiting in the queue, and pumps MODIFIED ones', () => {
      return testInput('throttleMap', [
        'side_2',
        'res_102',
        'side_4',
        'res_104',
      ], {
        maxBufferSize: 1, // testing the numberOfReservedSlots-- line
      })
    })
  })

  describe('MudPipe.skipTap', () => {
    it('whatever', () => {
      return testInput('skipTap', [
        'side_1',
        'res_1',
        'side_3',
        'res_3',
      ], {
        maxBufferSize: 1, // testing the numberOfReservedSlots-- line
      })
    })
  })

  describe('MudPipe.skipMap', () => {
    it('whatever', () => {
      return testInput('skipMap', [
        'side_1',
        'res_101',
        'side_3',
        'res_103',
      ], {
        maxBufferSize: 1, // testing the numberOfReservedSlots-- line
      })
    })
  })
})