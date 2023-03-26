'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](async (value) => {
    results.push('side_' + value)
    await delayPromise(1)
    throw new Error(value + 100)
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })
    .onBusyTap(async (value) => {
      results.push('on_busy_' + value)
    })
    .onIdle(async (value) => {
      results.push('on_idle_' + value)
    })

  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(3)

  await delayPromise(16)
  expect(results).to.eql(expected)
}

describe('PromiseValves.ErrorHandler with Synchronous input.', () => {

  describe('MoonPipe.queueTap', () => {
    it('handles all errors', () => {
      return testInput('queueTap', [
        'on_busy_1',
        'side_1',
        'err_101',
        'side_2',
        'err_102',
        'side_3',
        'err_103',
        'on_idle_undefined',
      ])
    })
  })

  describe('MoonPipe.queueMap', () => {
    it('handles all errors', () => {
      return testInput('queueMap', [
        'on_busy_1',
        'side_1',
        'err_101',
        'side_2',
        'err_102',
        'side_3',
        'err_103',
        'on_idle_undefined',
      ])
    })
  })

  describe('MoonPipe.cancelTap', () => {
    it('handles all errors', () => {
      return testInput('cancelTap', [
        'on_busy_1',
        'side_3',
        'err_103',
        'on_idle_undefined',
      ])
    })
  })

  describe('MoonPipe.cancelMap', () => {
    it('handles all errors', () => {
      return testInput('cancelMap', [
        'on_busy_1',
        'side_3',
        'err_103',
        'on_idle_undefined',
      ])
    })
  })

  describe('MoonPipe.throttleTap', () => {
    it('handles all errors', () => {
      return testInput('throttleTap', [
        'on_busy_1',
        'side_3',
        'err_103',
        'on_idle_undefined',
      ])
    })
  })

  describe('MoonPipe.throttleMap', () => {
    it('handles all errors', () => {
      return testInput('throttleMap', [
        'on_busy_1',
        'side_3',
        'err_103',
        'on_idle_undefined',
      ])
    })
  })

  describe('MoonPipe.skipTap', () => {
    it('handles all errors', () => {
      return testInput('skipTap', [
        'on_busy_1',
        'side_1',
        'err_101',
        'on_idle_undefined',
      ])
    })
  })

  describe('MoonPipe.skipMap', () => {
    it('handles all errors', () => {
      return testInput('skipMap', [
        'on_busy_1',
        'side_1',
        'err_101',
        'on_idle_undefined',
      ])
    })
  })
})
