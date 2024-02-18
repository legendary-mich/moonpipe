'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

class InvalidBackoff {
  constructor() {}
  nextDelayMs() {
    throw new Error('invalid nextDelayMs')
  }
}

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](async (value) => {
    results.push('side_' + value)
    throw new Error(value + 100)
  }, {
    repeatPredicate: (attemptsMade, err) => {
      return err && attemptsMade <= 2
    },
    repeatBackoffFactory: () => new InvalidBackoff,
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      results.push('err_' + err.message)
    })

  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(3)
  await delayPromise(3)
  expect(results).to.eql(expected[0])
}

describe('PromiseValves.Repeat.Backoff.nextDelayMs.Throws.js', () => {

  describe('MoonPipe.queueTap', () => {
    it('handles errors thrown in nextDelayMs', () => {
      return testInput('queueTap', [
        [
          "side_1",
          "err_invalid nextDelayMs",
          "side_2",
          "err_invalid nextDelayMs",
          "side_3",
          "err_invalid nextDelayMs",
        ],
      ])
    })
  })
})
