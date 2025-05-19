'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](async (value) => {
    results.push('side_' + value)
    await delayPromise(1)
    if (value === 1) throw new Error(value + 100)
    return value + 100
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    // When there's no error handler all errors should be silently ignored
    // .queueError(async (err) => {
    //   await delayPromise(2)
    //   results.push('err_' + err.message)
    // })
    .onBusy(() => {
      results.push('on_busy')
    })
    .onIdle(() => {
      results.push('on_idle')
    })

  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(3)

  await delayPromise(16)
  expect(results).to.eql(expected)
}

// When there's no error handler all errors should be silently ignored
describe('PromiseValves.No.ErrorHandler.2', () => {

  describe('MoonPipe.queueTap', () => {
    it('ignores all errors', () => {
      return testInput('queueTap', [
        'on_busy',
        'side_1',
        'side_2',
        'res_2',
        'side_3',
        'res_3',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.queueMap', () => {
    it('ignores all errors', () => {
      return testInput('queueMap', [
        'on_busy',
        'side_1',
        'side_2',
        'res_102',
        'side_3',
        'res_103',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.cancelTap', () => {
    it('ignores all errors', () => {
      return testInput('cancelTap', [
        'on_busy',
        'side_1',
        'side_2',
        'side_3',
        'res_3',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.cancelMap', () => {
    it('ignores all errors', () => {
      return testInput('cancelMap', [
        'on_busy',
        'side_1',
        'side_2',
        'side_3',
        'res_103',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.throttleTap', () => {
    it('ignores all errors', () => {
      return testInput('throttleTap', [
        'on_busy',
        'side_1',
        'side_3',
        'res_3',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.throttleMap', () => {
    it('ignores all errors', () => {
      return testInput('throttleMap', [
        'on_busy',
        'side_1',
        'side_3',
        'res_103',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.skipTap', () => {
    it('ignores all errors', () => {
      return testInput('skipTap', [
        'on_busy',
        'side_1',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.skipMap', () => {
    it('ignores all errors', () => {
      return testInput('skipMap', [
        'on_busy',
        'side_1',
        'on_idle',
      ])
    })
  })
})
