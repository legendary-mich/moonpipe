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
    // When there's no error handler all errors should be silently ignored
    // .queueError(async (err) => {
    //   await delayPromise(2)
    //   results.push('err_' + err.message)
    // })

  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(3)

  await delayPromise(16)
  expect(results).to.eql(expected)
}

// When there's no error handler all errors should be silently ignored
describe('PromiseValves.No.ErrorHandler with Synchronous input.', () => {

  describe('MoonPipe.queueTap', () => {
    it('ignores all errors', () => {
      return testInput('queueTap', [
        'side_1',
        'side_2',
        'side_3',
      ])
    })
  })

  describe('MoonPipe.queueMap', () => {
    it('ignores all errors', () => {
      return testInput('queueMap', [
        'side_1',
        'side_2',
        'side_3',
      ])
    })
  })

  describe('MoonPipe.cancelTap', () => {
    it('ignores all errors', () => {
      return testInput('cancelTap', [
        'side_3',
      ])
    })
  })

  describe('MoonPipe.cancelMap', () => {
    it('ignores all errors', () => {
      return testInput('cancelMap', [
        'side_3',
      ])
    })
  })

  describe('MoonPipe.throttleTap', () => {
    it('ignores all errors', () => {
      return testInput('throttleTap', [
        'side_3',
      ])
    })
  })

  describe('MoonPipe.throttleMap', () => {
    it('ignores all errors', () => {
      return testInput('throttleMap', [
        'side_3',
      ])
    })
  })

  describe('MoonPipe.skipTap', () => {
    it('ignores all errors', () => {
      return testInput('skipTap', [
        'side_1',
      ])
    })
  })

  describe('MoonPipe.skipMap', () => {
    it('ignores all errors', () => {
      return testInput('skipMap', [
        'side_1',
      ])
    })
  })
})
