'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](async (value, promiseContext) => {
    promiseContext.onCancel = () => results.push('cancelled_' + value)
    results.push('side_' + value)
    await delayPromise(100)
    return value + 100
  }, {
    timeoutMs: 105,
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })

  pipe.pump(1)
  await delayPromise(110)
  expect(results).to.eql(expected)
}

describe('PromiseValves with a Timeout long enough.', () => {

  describe('MoonPipe.queueTap', () => {
    it('does NOT emit a TimeoutError', () => {
      return testInput('queueTap', [
        'side_1',
        'res_1',
      ])
    })
  })

  describe('MoonPipe.queueMap', () => {
    it('does NOT emit a TimeoutError', () => {
      return testInput('queueMap', [
        'side_1',
        'res_101',
      ])
    })
  })

  describe('MoonPipe.cancelTap', () => {
    it('does NOT emit a TimeoutError', () => {
      return testInput('cancelTap', [
        'side_1',
        'res_1',
      ])
    })
  })

  describe('MoonPipe.cancelMap', () => {
    it('does NOT emit a TimeoutError', () => {
      return testInput('cancelMap', [
        'side_1',
        'res_101',
      ])
    })
  })

  describe('MoonPipe.throttleTap', () => {
    it('does NOT emit a TimeoutError', () => {
      return testInput('throttleTap', [
        'side_1',
        'res_1',
      ])
    })
  })

  describe('MoonPipe.throttleMap', () => {
    it('does NOT emit a TimeoutError', () => {
      return testInput('throttleMap', [
        'side_1',
        'res_101',
      ])
    })
  })

  describe('MoonPipe.skipTap', () => {
    it('whatever', () => {
      return testInput('skipTap', [
        'side_1',
        'res_1',
      ])
    })
  })

  describe('MoonPipe.skipMap', () => {
    it('whatever', () => {
      return testInput('skipMap', [
        'side_1',
        'res_101',
      ])
    })
  })
})
