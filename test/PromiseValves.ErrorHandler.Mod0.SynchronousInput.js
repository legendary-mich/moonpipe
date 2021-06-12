'use strict'

const { expect } = require('chai')
const { MudPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MudPipe()[method](async (value) => {
    results.push('side_' + value)
    await delayPromise(1)
    if (value % 2 === 0) {
      throw new Error(value + 100)
    }
    else {
      return value + 100
    }
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .handleError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })

  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(3)

  await delayPromise(16)
  expect(results).to.eql(expected)
}

describe('PromiseValves.ErrorHandler Mod0 with Synchronous input.', () => {

  describe('MudPipe.queueTap', () => {
    it('handles all errors', () => {
      return testInput('queueTap', [
        'side_1',
        'res_1',
        'side_2',
        'err_102',
        'side_3',
        'res_3',
      ])
    })
  })

  describe('MudPipe.queueMap', () => {
    it('handles all errors', () => {
      return testInput('queueMap', [
        'side_1',
        'res_101',
        'side_2',
        'err_102',
        'side_3',
        'res_103',
      ])
    })
  })

  describe('MudPipe.cancelTap', () => {
    it('handles all errors', () => {
      return testInput('cancelTap', [
        'side_1',
        'side_2',
        'side_3',
        'res_3',
      ])
    })
  })

  describe('MudPipe.cancelMap', () => {
    it('handles all errors', () => {
      return testInput('cancelMap', [
        'side_1',
        'side_2',
        'side_3',
        'res_103',
      ])
    })
  })

  describe('MudPipe.throttleTap', () => {
    it('handles all errors', () => {
      return testInput('throttleTap', [
        'side_1',
        'res_1',
        'side_3',
        'res_3',
      ])
    })
  })

  describe('MudPipe.throttleMap', () => {
    it('handles all errors', () => {
      return testInput('throttleMap', [
        'side_1',
        'res_101',
        'side_3',
        'res_103',
      ])
    })
  })

  describe('MudPipe.skipTap', () => {
    it('whatever', () => {
      return testInput('skipTap', [
        'side_1',
        'res_1',
        'side_2',
        'err_102',
      ])
    })
  })

  describe('MudPipe.skipMap', () => {
    it('whatever', () => {
      return testInput('skipMap', [
        'side_1',
        'res_101',
        'side_2',
        'err_102',
      ])
    })
  })
})
