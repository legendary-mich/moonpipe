'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](async (value) => {
    results.push('side_' + value)
    await delayPromise(1)
    return value + 100
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })
    .onIdle(() => {
      results.push('on_idle')
    })
    .onBusy(() => {
      results.push('on_busy')
    })

  pipe.pump(1)
  await Promise.resolve()
  pipe.pump(2)
  await Promise.resolve()
  pipe.pump(3)
  await delayPromise(16)
  expect(results).to.eql(expected)
}

describe('PromiseValves with Asynchronous input.', () => {

  describe('MoonPipe.queueTap', () => {
    it('pumps ORIGINAL values', () => {
      return testInput('queueTap', [
        'on_busy',
        'side_1',
        'res_1',
        'side_2',
        'res_2',
        'side_3',
        'res_3',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.queueMap', () => {
    it('pumps MODIFIED values', () => {
      return testInput('queueMap', [
        'on_busy',
        'side_1',
        'res_101',
        'side_2',
        'res_102',
        'side_3',
        'res_103',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.cancelTap', () => {
    it('cancels initial promises, and resolves the last one with the ORIGINAL value', () => {
      return testInput('cancelTap', [
        'on_busy',
        'side_1',
        'side_2',
        'side_3',
        'res_3',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.cancelMap', () => {
    it('cancels initial promises, and resolves the last one with a MODIFIED value', () => {
      return testInput('cancelMap', [
        'on_busy',
        'side_1',
        'side_2',
        'side_3',
        'res_103',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.throttleTap', () => {
    it('removes values which are waiting in the queue, and pumps ORIGINAL ones', () => {
      return testInput('throttleTap', [
        'on_busy',
        'side_1',
        'res_1',
        'side_3',
        'res_3',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.throttleMap', () => {
    it('removes values which are waiting in the queue, and pumps MODIFIED ones', () => {
      return testInput('throttleMap', [
        'on_busy',
        'side_1',
        'res_101',
        'side_3',
        'res_103',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.skipTap', () => {
    it('whatever', () => {
      return testInput('skipTap', [
        'on_busy',
        'side_1',
        'res_1',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.skipMap', () => {
    it('whatever', () => {
      return testInput('skipMap', [
        'on_busy',
        'side_1',
        'res_101',
        'on_idle',
      ])
    })
  })
})
