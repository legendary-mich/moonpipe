'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const counters = [1, 1, 1]
  const pipe = new MoonPipe()
    .queueTap(async (value) => {
      const shouldThrow = counters[0] % 3 === 0
      await delayPromise(shouldThrow ? 3 : 1)
      if (shouldThrow) {
        throw new Error(value +  100)
      }
      counters[0]++
    })
    .queueTap(async (value) => {
      const shouldThrow = counters[1] % 3 === 2
      await delayPromise(shouldThrow ? 3 : 1)
      if (shouldThrow) {
        throw new Error(value + 200)
      }
      counters[1]++
    })
    .queueTap(async (value) => {
      const shouldThrow = counters[2] % 3 === 1
      await delayPromise(shouldThrow ? 3 : 1)
      if (shouldThrow) {
        throw new Error(value + 300)
      }
      counters[2]++
    })[method](async (err) => {
      results.push('err_' + err.message)
      await delayPromise(6)
    }, { timeoutMs: 3 }) // <---------- timeout is HERE
    .queueTap(async (value) => {
      results.push(value)
    })
    .queueError(async (err) => {
      results.push('2nd_handler_' + err.message)
    })

  pipe.pump(3)
  pipe.pump(2)
  pipe.pump(1)

  await delayPromise(30)
  expect(results).to.eql(expected)
}

describe('PromiseValves.ErrorHandler.InBetween.AllErrorTypes.Timeout.js', () => {

  describe('MoonPipe.queueError', () => {
    it('handles all errors', () => {
      return testInput('queueError', [
        'err_303',
        '2nd_handler_TimeoutError',
        'err_202',
        '2nd_handler_TimeoutError',
        'err_101',
        '2nd_handler_TimeoutError',
      ])
    })
  })

  describe('MoonPipe.cancelError', () => {
    it('handles all errors', () => {
      return testInput('cancelError', [
        'err_303',
        'err_202',
        'err_101',
        '2nd_handler_TimeoutError',
      ])
    })
  })

  describe('MoonPipe.throttleError', () => {
    it('handles all errors', () => {
      return testInput('throttleError', [
        'err_303',
        '2nd_handler_TimeoutError',
        'err_101',
        '2nd_handler_TimeoutError',
      ])
    })
  })

  describe('MoonPipe.skipError', () => {
    it('handles all errors', () => {
      return testInput('skipError', [
        'err_303',
        '2nd_handler_TimeoutError',
      ])
    })
  })

})
