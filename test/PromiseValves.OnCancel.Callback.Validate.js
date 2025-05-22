'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](async (value, promiseContext) => {
    results.push('side_' + value)
    promiseContext.onCancel = 153
    await delayPromise(1)
    return value + 100
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      await delayPromise(1)
      results.push('err_' + err.message)
    })

  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(3)
  await delayPromise(16)
  expect(results).to.eql(expected)
}

describe('PromiseValves.OnCancel.Callback.Validate', () => {

  describe('MoonPipe.queueTap', () => {
    it('pumps ORIGINAL values', () => {
      return testInput('queueTap', [
        "side_1",
        "err_Expected 'onCancel' to be a 'function'",
        "side_2",
        "err_Expected 'onCancel' to be a 'function'",
        "side_3",
        "err_Expected 'onCancel' to be a 'function'",
      ])
    })
  })

  describe('MoonPipe.queueMap', () => {
    it('pumps MODIFIED values', () => {
      return testInput('queueMap', [
        "side_1",
        "err_Expected 'onCancel' to be a 'function'",
        "side_2",
        "err_Expected 'onCancel' to be a 'function'",
        "side_3",
        "err_Expected 'onCancel' to be a 'function'",
      ])
    })
  })

  describe('MoonPipe.cancelTap', () => {
    it('cancels initial promises, and resolves the last one with the ORIGINAL value', () => {
      return testInput('cancelTap', [
        "side_1",
        "side_2",
        "side_3",
        "err_Expected 'onCancel' to be a 'function'",
      ])
    })
  })

  describe('MoonPipe.cancelMap', () => {
    it('cancels initial promises, and resolves the last one with a MODIFIED value', () => {
      return testInput('cancelMap', [
        "side_1",
        "side_2",
        "side_3",
        "err_Expected 'onCancel' to be a 'function'",
      ])
    })
  })

  describe('MoonPipe.throttleTap', () => {
    it('removes values which are waiting in the queue, and pumps ORIGINAL ones', () => {
      return testInput('throttleTap', [
        "side_1",
        "err_Expected 'onCancel' to be a 'function'",
        "side_3",
        "err_Expected 'onCancel' to be a 'function'",
      ])
    })
  })

  describe('MoonPipe.throttleMap', () => {
    it('removes values which are waiting in the queue, and pumps MODIFIED ones', () => {
      return testInput('throttleMap', [
        "side_1",
        "err_Expected 'onCancel' to be a 'function'",
        "side_3",
        "err_Expected 'onCancel' to be a 'function'",
      ])
    })
  })

  describe('MoonPipe.skipTap', () => {
    it('whatever', () => {
      return testInput('skipTap', [
        "side_1",
        "err_Expected 'onCancel' to be a 'function'",
      ])
    })
  })

  describe('MoonPipe.skipMap', () => {
    it('whatever', () => {
      return testInput('skipMap', [
        "side_1",
        "err_Expected 'onCancel' to be a 'function'",
      ])
    })
  })
})
