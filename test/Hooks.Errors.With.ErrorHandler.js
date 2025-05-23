'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()
    .onBusyTap((value) => {
      results.push('busyTap_' + value)
      if (method === 'onBusyTap') throw new Error(method)
    })
    .onBusy(() => {
      results.push('busy')
      if (method === 'onBusy') throw new Error(method)
    })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })
    .onIdle(() => {
      results.push('idle')
      if (method === 'onIdle') throw new Error(method)
    })

  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(3)

  await delayPromise(16)
  expect(results).to.eql(expected)
  expect(pipe.isBusy()).to.eql(false)
}

describe('Hooks.Errors.With.ErrorHandler', () => {

  describe('MoonPipe.onBusyTap', () => {
    it('handles all errors', () => {
      return testInput('onBusyTap', [
        'busyTap_1',
        'busy',
        'err_onBusyTap',
        'res_2',
        'res_3',
        'idle',
      ])
    })
  })

  describe('MoonPipe.onBusy', () => {
    it('pumps the error to the first error valve', () => {
      return testInput('onBusy', [
        'busyTap_1',
        'busy',
        'err_onBusy',
        'res_1',
        'res_2',
        'res_3',
        'idle',
      ])
    })
  })

  describe('MoonPipe.onIdle', () => {
    it('pumps the error to the first error valve', () => {
      return testInput('onIdle', [
        'busyTap_1',
        'busy',
        'res_1',
        'res_2',
        'res_3',
        'idle',
        'err_onIdle',
      ])
    })
  })
})
