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
    repeatVerbose: true,
    repeatPredicate: (attemptsMade, err) => {
      return err && attemptsMade <= 2
    },
    timeoutMs: 90,
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      results.push('err_' + err.message)
      await delayPromise(2)
    })

  pipe.pump(1)
  await delayPromise(1)
  pipe.pump(2)
  await delayPromise(600)
  expect(results).to.eql(expected)
}

describe('PromiseValves.Repeat.Fail.Timeout.Verbose', () => {

  describe('MoonPipe.queueTap', () => {
    it('emits an Error', () => {
      return testInput('queueTap', [
        'side_1',
        'cancelled_1',
        'err_TimeoutError',
        'side_1',
        'cancelled_1',
        'err_TimeoutError',
        'side_1',
        'cancelled_1',
        'err_TimeoutError',
        'side_2',
        'cancelled_2',
        'err_TimeoutError',
        'side_2',
        'cancelled_2',
        'err_TimeoutError',
        'side_2',
        'cancelled_2',
        'err_TimeoutError',
      ])
    })
  })

  describe('MoonPipe.queueMap', () => {
    it('emits an Error', () => {
      return testInput('queueMap', [
        'side_1',
        'cancelled_1',
        'err_TimeoutError',
        'side_1',
        'cancelled_1',
        'err_TimeoutError',
        'side_1',
        'cancelled_1',
        'err_TimeoutError',
        'side_2',
        'cancelled_2',
        'err_TimeoutError',
        'side_2',
        'cancelled_2',
        'err_TimeoutError',
        'side_2',
        'cancelled_2',
        'err_TimeoutError',
      ])
    })
  })

  describe('MoonPipe.cancelTap', () => {
    it('emits an Error', () => {
      return testInput('cancelTap', [
        'side_1',
        'cancelled_1',
        'side_2',
        'cancelled_2',
        'err_TimeoutError',
        'side_2',
        'cancelled_2',
        'err_TimeoutError',
        'side_2',
        'cancelled_2',
        'err_TimeoutError',
      ])
    })
  })

  describe('MoonPipe.cancelMap', () => {
    it('emits an Error', () => {
      return testInput('cancelMap', [
        'side_1',
        'cancelled_1',
        'side_2',
        'cancelled_2',
        'err_TimeoutError',
        'side_2',
        'cancelled_2',
        'err_TimeoutError',
        'side_2',
        'cancelled_2',
        'err_TimeoutError',
      ])
    })
  })

  describe('MoonPipe.throttleTap', () => {
    it('emits an Error', () => {
      return testInput('throttleTap', [
        'side_1',
        'cancelled_1',
        'err_TimeoutError',
        'side_1',
        'cancelled_1',
        'err_TimeoutError',
        'side_1',
        'cancelled_1',
        'err_TimeoutError',
        'side_2',
        'cancelled_2',
        'err_TimeoutError',
        'side_2',
        'cancelled_2',
        'err_TimeoutError',
        'side_2',
        'cancelled_2',
        'err_TimeoutError',
      ])
    })
  })

  describe('MoonPipe.throttleMap', () => {
    it('emits an Error', () => {
      return testInput('throttleMap', [
        'side_1',
        'cancelled_1',
        'err_TimeoutError',
        'side_1',
        'cancelled_1',
        'err_TimeoutError',
        'side_1',
        'cancelled_1',
        'err_TimeoutError',
        'side_2',
        'cancelled_2',
        'err_TimeoutError',
        'side_2',
        'cancelled_2',
        'err_TimeoutError',
        'side_2',
        'cancelled_2',
        'err_TimeoutError',
      ])
    })
  })

  describe('MoonPipe.skipTap', () => {
    it('whatever', () => {
      return testInput('skipTap', [
        'side_1',
        'cancelled_1',
        'err_TimeoutError',
        'side_1',
        'cancelled_1',
        'err_TimeoutError',
        'side_1',
        'cancelled_1',
        'err_TimeoutError',
      ])
    })
  })

  describe('MoonPipe.skipMap', () => {
    it('whatever', () => {
      return testInput('skipMap', [
        'side_1',
        'cancelled_1',
        'err_TimeoutError',
        'side_1',
        'cancelled_1',
        'err_TimeoutError',
        'side_1',
        'cancelled_1',
        'err_TimeoutError',
      ])
    })
  })
})
