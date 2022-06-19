'use strict'

const { expect } = require('chai')
const { MudPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MudPipe()[method](async (value) => {
    results.push('side_' + value)
    await delayPromise(100)
    return value + 100
  }, {
    repeatPredicate: (attemptsMade, err) => {
      return err && attemptsMade <= 2
    },
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
  await delayPromise(1)
  pipe.pump(2)
  await delayPromise(600)
  expect(results).to.eql(expected)
}

describe('PromiseValves Repeat on Error with Timeout - All Failures,', () => {

  describe('MudPipe.queueTap', () => {
    it('emits an Error', () => {
      return testInput('queueTap', [
        'side_1',
        'side_1',
        'side_1',
        'err_TimeoutError',
        'side_2',
        'side_2',
        'side_2',
        'err_TimeoutError',
      ])
    })
  })

  describe('MudPipe.queueMap', () => {
    it('emits an Error', () => {
      return testInput('queueMap', [
        'side_1',
        'side_1',
        'side_1',
        'err_TimeoutError',
        'side_2',
        'side_2',
        'side_2',
        'err_TimeoutError',
      ])
    })
  })

  describe('MudPipe.cancelTap', () => {
    it('emits an Error', () => {
      return testInput('cancelTap', [
        'side_1',
        'side_2',
        'side_2',
        'side_2',
        'err_TimeoutError',
      ])
    })
  })

  describe('MudPipe.cancelMap', () => {
    it('emits an Error', () => {
      return testInput('cancelMap', [
        'side_1',
        'side_2',
        'side_2',
        'side_2',
        'err_TimeoutError',
      ])
    })
  })

  describe('MudPipe.throttleTap', () => {
    it('emits an Error', () => {
      return testInput('throttleTap', [
        'side_1',
        'side_1',
        'side_1',
        'err_TimeoutError',
        'side_2',
        'side_2',
        'side_2',
        'err_TimeoutError',
      ])
    })
  })

  describe('MudPipe.throttleMap', () => {
    it('emits an Error', () => {
      return testInput('throttleMap', [
        'side_1',
        'side_1',
        'side_1',
        'err_TimeoutError',
        'side_2',
        'side_2',
        'side_2',
        'err_TimeoutError',
      ])
    })
  })

  describe('MudPipe.skipTap', () => {
    it('whatever', () => {
      return testInput('skipTap', [
        'side_1',
        'side_1',
        'side_1',
        'err_TimeoutError',
      ])
    })
  })

  describe('MudPipe.skipMap', () => {
    it('whatever', () => {
      return testInput('skipMap', [
        'side_1',
        'side_1',
        'side_1',
        'err_TimeoutError',
      ])
    })
  })
})
