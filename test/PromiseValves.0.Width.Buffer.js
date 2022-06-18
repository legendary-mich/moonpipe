'use strict'

const { expect } = require('chai')
const { MudPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MudPipe()[method](async (value) => {
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

  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(3)

  await delayPromise(16)
  expect(results).to.eql(expected)
}

describe('PromiseValves with maxBufferSize set to 0', () => {

  describe('MudPipe.queueTap', () => {
    it('pumps ORIGINAL values', () => {
      return testInput('queueTap', [
        'err_Buffer overflow',
        'err_Buffer overflow',
        'err_Buffer overflow',
      ])
    })
  })

  describe('MudPipe.queueMap', () => {
    it('pumps MODIFIED values', () => {
      return testInput('queueMap', [
        'err_Buffer overflow',
        'err_Buffer overflow',
        'err_Buffer overflow',
      ])
    })
  })

  describe('MudPipe.cancelTap', () => {
    it('cancels initial promises, and resolves the last one with the ORIGINAL value', () => {
      return testInput('cancelTap', [
        'side_3',
        'res_3',
      ])
    })
  })

  describe('MudPipe.cancelMap', () => {
    it('cancels initial promises, and resolves the last one with a MODIFIED value', () => {
      return testInput('cancelMap', [
        'side_3',
        'res_103',
      ])
    })
  })

  describe('MudPipe.throttleTap', () => {
    it('removes values which are waiting in the queue, and pumps ORIGINAL ones', () => {
      return testInput('throttleTap', [
        'side_3',
        'res_3',
      ])
    })
  })

  describe('MudPipe.throttleMap', () => {
    it('removes values which are waiting in the queue, and pumps MODIFIED ones', () => {
      return testInput('throttleMap', [
        'side_3',
        'res_103',
      ])
    })
  })

  describe('MudPipe.skipTap', () => {
    it('whatever', () => {
      return testInput('skipTap', [
      ])
    })
  })

  describe('MudPipe.skipMap', () => {
    it('whatever', () => {
      return testInput('skipMap', [
      ])
    })
  })
})