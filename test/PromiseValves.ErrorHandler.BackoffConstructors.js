'use strict'

const { expect } = require('chai')
const { MoonPipe, ConstantBackoff, LinearBackoff } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, repeatBackoffFactory, expected) {
  const results = []
  const pipe = new MoonPipe()[method](async (value) => {
    results.push('side_' + value)
    await delayPromise(1)
    throw new Error(value + 100)
  }, {
    repeatBackoffFactory,
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })
    .onIdle(() => {
      results.push('on_idle')
    })

  pipe.pump(1)
  pipe.pump(2)
  await delayPromise(10)
  expect(results).to.eql(expected[0])

  pipe.pump(1)
  pipe.pump(2)
  await delayPromise(10)
  expect(results).to.eql(expected[1])
}

describe('PromiseValves.ErrorHandler.BackoffConstructors.js', () => {

  describe('MoonPipe.queueTap, ConstantBackoff', () => {
    it('handles all errors', () => {
      return testInput('queueTap', () => new ConstantBackoff('xo'), [
        [
          "err_Expected delay to be a 'number' greater or equal to 0; found: xo",
          "err_Expected delay to be a 'number' greater or equal to 0; found: xo",
          "on_idle",
        ],
        [
          "err_Expected delay to be a 'number' greater or equal to 0; found: xo",
          "err_Expected delay to be a 'number' greater or equal to 0; found: xo",
          "on_idle",
          "err_Expected delay to be a 'number' greater or equal to 0; found: xo",
          "err_Expected delay to be a 'number' greater or equal to 0; found: xo",
          "on_idle",
        ],
      ])
    })
  })

  // The throttleTap case is useful for testing whether the
  // numberOfReservedSlots-- part is handled correctly
  describe('MoonPipe.throttleTap, ConstantBackoff', () => {
    it('handles all errors', () => {
      return testInput('throttleTap', () => new ConstantBackoff('xo'), [
        [
          "err_Expected delay to be a 'number' greater or equal to 0; found: xo",
          "err_Expected delay to be a 'number' greater or equal to 0; found: xo",
          "on_idle",
        ],
        [
          "err_Expected delay to be a 'number' greater or equal to 0; found: xo",
          "err_Expected delay to be a 'number' greater or equal to 0; found: xo",
          "on_idle",
          "err_Expected delay to be a 'number' greater or equal to 0; found: xo",
          "err_Expected delay to be a 'number' greater or equal to 0; found: xo",
          "on_idle",
        ],
      ])
    })
  })

  describe('MoonPipe.queueTap, LinearBackoff', () => {
    it('handles all errors', () => {
      return testInput('queueTap', () => new LinearBackoff('xo'), [
        [
          "err_Expected baseDelay to be a 'number' greater or equal to 0; found: xo",
          "err_Expected baseDelay to be a 'number' greater or equal to 0; found: xo",
          "on_idle",
        ],
        [
          "err_Expected baseDelay to be a 'number' greater or equal to 0; found: xo",
          "err_Expected baseDelay to be a 'number' greater or equal to 0; found: xo",
          "on_idle",
          "err_Expected baseDelay to be a 'number' greater or equal to 0; found: xo",
          "err_Expected baseDelay to be a 'number' greater or equal to 0; found: xo",
          "on_idle",
        ],
      ])
    })
  })
})
