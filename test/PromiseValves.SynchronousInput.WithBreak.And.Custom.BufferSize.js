'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected, settingsOverride) {
  const results = []
  const pipe = new MoonPipe()[method](async (value) => {
    results.push('side_' + value)
    await delayPromise(1)
    return value + 100
  }, settingsOverride)
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })
    .onBusyTap(async (value) => {
      results.push('on_busy_' + value)
    })
    .onIdle(async (value) => {
      results.push('on_idle_' + value)
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

  describe('MoonPipe.queueTap', () => {
    it('pumps ORIGINAL values', () => {
      return testInput('queueTap', [
        'on_busy_1',
        'side_1',
        'res_1',
        'side_2',
        'res_2',
        'on_idle_undefined',
        'on_busy_3',
        'side_3',
        'res_3',
        'side_4',
        'res_4',
        'on_idle_undefined',
      ], {
        maxBufferSize: 2, // testing the numberOfReservedSlots-- line
      })
    })
  })

  describe('MoonPipe.queueMap', () => {
    it('pumps MODIFIED values', () => {
      return testInput('queueMap', [
        'on_busy_1',
        'side_1',
        'res_101',
        'side_2',
        'res_102',
        'on_idle_undefined',
        'on_busy_3',
        'side_3',
        'res_103',
        'side_4',
        'res_104',
        'on_idle_undefined',
      ], {
        maxBufferSize: 2, // testing the numberOfReservedSlots-- line
      })
    })
  })

  describe('MoonPipe.cancelTap', () => {
    it('cancels initial promises, and resolves the last one with the ORIGINAL value', () => {
      return testInput('cancelTap', [
        'on_busy_1',
        'side_1',
        'side_2',
        'res_2',
        'on_idle_undefined',
        'on_busy_3',
        'side_3',
        'side_4',
        'res_4',
        'on_idle_undefined',
      ], {
        maxBufferSize: 2, // testing the numberOfReservedSlots-- line
      })
    })
  })

  describe('MoonPipe.cancelMap', () => {
    it('cancels initial promises, and resolves the last one with a MODIFIED value', () => {
      return testInput('cancelMap', [
        'on_busy_1',
        'side_1',
        'side_2',
        'res_102',
        'on_idle_undefined',
        'on_busy_3',
        'side_3',
        'side_4',
        'res_104',
        'on_idle_undefined',
      ], {
        maxBufferSize: 2, // testing the numberOfReservedSlots-- line
      })
    })
  })

  describe('MoonPipe.throttleTap', () => {
    it('removes values which are waiting in the queue, and pumps ORIGINAL ones', () => {
      return testInput('throttleTap', [
        'on_busy_1',
        'side_2',
        'res_2',
        'on_idle_undefined',
        'on_busy_3',
        'side_4',
        'res_4',
        'on_idle_undefined',
      ], {
        maxBufferSize: 1, // testing the numberOfReservedSlots-- line
      })
    })
  })

  describe('MoonPipe.throttleMap', () => {
    it('removes values which are waiting in the queue, and pumps MODIFIED ones', () => {
      return testInput('throttleMap', [
        'on_busy_1',
        'side_2',
        'res_102',
        'on_idle_undefined',
        'on_busy_3',
        'side_4',
        'res_104',
        'on_idle_undefined',
      ], {
        maxBufferSize: 1, // testing the numberOfReservedSlots-- line
      })
    })
  })

  describe('MoonPipe.skipTap', () => {
    it('whatever', () => {
      return testInput('skipTap', [
        'on_busy_1',
        'side_1',
        'res_1',
        'on_idle_undefined',
        'on_busy_3',
        'side_3',
        'res_3',
        'on_idle_undefined',
      ], {
        maxBufferSize: 1, // testing the numberOfReservedSlots-- line
      })
    })
  })

  describe('MoonPipe.skipMap', () => {
    it('whatever', () => {
      return testInput('skipMap', [
        'on_busy_1',
        'side_1',
        'res_101',
        'on_idle_undefined',
        'on_busy_3',
        'side_3',
        'res_103',
        'on_idle_undefined',
      ], {
        maxBufferSize: 1, // testing the numberOfReservedSlots-- line
      })
    })
  })
})
