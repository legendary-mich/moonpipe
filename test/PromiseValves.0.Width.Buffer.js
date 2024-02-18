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
  }, {
    maxBufferSize: 0,
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })
    .onBusy(() => {
      results.push('on_busy')
    })
    .onIdle(() => {
      results.push('on_idle')
    })

  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(3)

  await delayPromise(16)
  expect(results).to.eql(expected)
}

describe('PromiseValves with maxBufferSize set to 0', () => {

  describe('MoonPipe.queueTap', () => {
    it('pumps ORIGINAL values', () => {
      return testInput('queueTap', [
        'on_busy',
        'err_Buffer overflow',
        'err_Buffer overflow',
        'err_Buffer overflow',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.queueMap', () => {
    it('pumps MODIFIED values', () => {
      return testInput('queueMap', [
        'on_busy',
        'err_Buffer overflow',
        'err_Buffer overflow',
        'err_Buffer overflow',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.cancelTap', () => {
    it('cancels initial promises, and resolves the last one with the ORIGINAL value', () => {
      return testInput('cancelTap', [
        'on_busy',
        'on_idle',
        'on_busy',
        'on_idle',
        'on_busy',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.cancelMap', () => {
    it('cancels initial promises, and resolves the last one with a MODIFIED value', () => {
      return testInput('cancelMap', [
        'on_busy',
        'on_idle',
        'on_busy',
        'on_idle',
        'on_busy',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.throttleTap', () => {
    it('removes values which are waiting in the queue, and pumps ORIGINAL ones', () => {
      return testInput('throttleTap', [
        'on_busy',
        'on_idle',
        'on_busy',
        'on_idle',
        'on_busy',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.throttleMap', () => {
    it('removes values which are waiting in the queue, and pumps MODIFIED ones', () => {
      return testInput('throttleMap', [
        'on_busy',
        'on_idle',
        'on_busy',
        'on_idle',
        'on_busy',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.skipTap', () => {
    it('whatever', () => {
      return testInput('skipTap', [
        'on_busy',
        'on_idle',
        'on_busy',
        'on_idle',
        'on_busy',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.skipMap', () => {
    it('whatever', () => {
      return testInput('skipMap', [
        'on_busy',
        'on_idle',
        'on_busy',
        'on_idle',
        'on_busy',
        'on_idle',
      ])
    })
  })
})
