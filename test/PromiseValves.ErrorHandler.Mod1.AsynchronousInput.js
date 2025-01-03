'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](async (value) => {
    results.push('side_' + value)
    await delayPromise(1)
    if (value % 2 === 1) {
      throw new Error(value + 100)
    }
    else {
      return value + 100
    }
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })

  pipe.pump(1)
  await Promise.resolve()
  pipe.pump(2)
  await Promise.resolve()
  pipe.pump(3)
  await delayPromise(20)
  expect(results).to.eql(expected)
}

describe('PromiseValves.ErrorHandler Mod1 with Asynchronous input.', () => {

  describe('MoonPipe.queueTap', () => {
    it('handles all errors', () => {
      return testInput('queueTap', [
        'side_1',
        'err_101',
        'side_2',
        'res_2',
        'side_3',
        'err_103',
      ])
    })
  })

  describe('MoonPipe.queueMap', () => {
    it('handles all errors', () => {
      return testInput('queueMap', [
        'side_1',
        'err_101',
        'side_2',
        'res_102',
        'side_3',
        'err_103',
      ])
    })
  })

  describe('MoonPipe.cancelTap', () => {
    it('handles all errors', () => {
      return testInput('cancelTap', [
        'side_1',
        'side_2',
        'side_3',
        'err_103',
      ])
    })
  })

  describe('MoonPipe.cancelMap', () => {
    it('handles all errors', () => {
      return testInput('cancelMap', [
        'side_1',
        'side_2',
        'side_3',
        'err_103',
      ])
    })
  })

  describe('MoonPipe.throttleTap', () => {
    it('handles all errors', () => {
      return testInput('throttleTap', [
        'side_1',
        'err_101',
        'side_3',
        'err_103',
      ])
    })
  })

  describe('MoonPipe.throttleMap', () => {
    it('handles all errors', () => {
      return testInput('throttleMap', [
        'side_1',
        'err_101',
        'side_3',
        'err_103',
      ])
    })
  })

  describe('MoonPipe.skipTap', () => {
    it('whatever', () => {
      return testInput('skipTap', [
        'side_1',
        'err_101',
      ])
    })
  })

  describe('MoonPipe.skipMap', () => {
    it('whatever', () => {
      return testInput('skipMap', [
        'side_1',
        'err_101',
      ])
    })
  })
})
