'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method]((value) => {
    results.push('on_hook_' + value)
    throw new Error('on_hook_err')
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

describe('Hooks.ErrorHandler with Synchronous input.', () => {

  describe('MoonPipe.onBusyTap', () => {
    it('handles all errors', () => {
      return testInput('onBusyTap', [
        'on_hook_1',
        'err_on_hook_err',
        'res_2',
        'res_3',
      ])
    })
  })

  describe('MoonPipe.onBusy', () => {
    it('handles all errors', () => {
      return testInput('onBusy', [
        'on_hook_undefined',
        'res_1',
        'res_2',
        'res_3',
      ])
    })
  })

  describe('MoonPipe.onIdle', () => {
    it('silently swallows the error', () => {
      return testInput('onIdle', [
        'res_1',
        'res_2',
        'res_3',
        'on_hook_undefined',
      ])
    })
  })
})
