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
      await delayPromise(3)
      results.push('err_' + err.message)
      throw 'err_handled_' + err.message
    })
    .queueTap(async (value) => {
      results.push(value)
    })
    .queueError(async (err) => {
      results.push('2nd_handler_' + err)
    })

  pipe.pump(3)
  pipe.pump(2)
  pipe.pump(1)

  await delayPromise(20)
  expect(results).to.eql(expected)
}

describe('PromiseValves.ErrorHandler.InBetween.AllErrorTypes.Rethrow.js', () => {

  describe('MoonPipe.queueError', () => {
    it('handles all errors', () => {
      return testInput('queueError', [
        'err_303',
        '2nd_handler_err_handled_303',
        'err_202',
        '2nd_handler_err_handled_202',
        'err_101',
        '2nd_handler_err_handled_101',
      ])
    })
  })

  describe('MoonPipe.cancelError', () => {
    it('handles all errors', () => {
      return testInput('cancelError', [
        'err_303',
        'err_202',
        'err_101',
        '2nd_handler_err_handled_101',
      ])
    })
  })

  describe('MoonPipe.throttleError', () => {
    it('handles all errors', () => {
      return testInput('throttleError', [
        'err_303',
        '2nd_handler_err_handled_303',
        'err_101',
        '2nd_handler_err_handled_101',
      ])
    })
  })

  describe('MoonPipe.skipError', () => {
    it('handles all errors', () => {
      return testInput('skipError', [
        'err_303',
        '2nd_handler_err_handled_303',
      ])
    })
  })

})
