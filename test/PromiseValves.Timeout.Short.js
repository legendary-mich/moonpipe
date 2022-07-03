'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](async (value) => {
    results.push('side_' + value)
    await delayPromise(100)
    return value + 100
  }, {
    timeoutMs: 90,
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })

  pipe.pump(1)
  await delayPromise(10)
  pipe.pump(2)
  await delayPromise(190)
  expect(results).to.eql(expected)
}

describe('PromiseValves with a Timeout short enough.', () => {

  describe('MoonPipe.queueTap', () => {
    it('emits a TimeoutError', () => {
      return testInput('queueTap', [
        'side_1',
        'err_TimeoutError',
        'side_2',
        'err_TimeoutError',
      ])
    })
  })

  describe('MoonPipe.queueMap', () => {
    it('emits a TimeoutError', () => {
      return testInput('queueMap', [
        'side_1',
        'err_TimeoutError',
        'side_2',
        'err_TimeoutError',
      ])
    })
  })

  describe('MoonPipe.cancelTap', () => {
    it('emits a TimeoutError', () => {
      return testInput('cancelTap', [
        'side_1',
        'side_2',
        'err_TimeoutError',
      ])
    })
  })

  describe('MoonPipe.cancelMap', () => {
    it('emits a TimeoutError', () => {
      return testInput('cancelMap', [
        'side_1',
        'side_2',
        'err_TimeoutError',
      ])
    })
  })

  describe('MoonPipe.throttleTap', () => {
    it('emits a TimeoutError', () => {
      return testInput('throttleTap', [
        'side_1',
        'err_TimeoutError',
        'side_2',
        'err_TimeoutError',
      ])
    })
  })

  describe('MoonPipe.throttleMap', () => {
    it('emits a TimeoutError', () => {
      return testInput('throttleMap', [
        'side_1',
        'err_TimeoutError',
        'side_2',
        'err_TimeoutError',
      ])
    })
  })

  describe('MoonPipe.skipTap', () => {
    it('whatever', () => {
      return testInput('skipTap', [
        'side_1',
        'err_TimeoutError',
      ])
    })
  })

  describe('MoonPipe.skipMap', () => {
    it('whatever', () => {
      return testInput('skipMap', [
        'side_1',
        'err_TimeoutError',
      ])
    })
  })
})
