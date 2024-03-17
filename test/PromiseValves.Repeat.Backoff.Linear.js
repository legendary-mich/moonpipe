'use strict'

const { expect } = require('chai')
const { MoonPipe, LinearBackoff } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  let counter = 0
  const delay = 12
  const pipe = new MoonPipe()[method](async (value) => {
    results.push('side_' + value)
    if (counter++ < 2) {
      throw new Error(value + 100)
    }
    else {
      counter = 0
      return value + 100
    }
  }, {
    repeatPredicate: (attemptsMade, err) => {
      return err && attemptsMade <= 2
    },
    repeatBackoffFactory: () => new LinearBackoff(delay),
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      results.push('err_' + err.message)
    })

  pipe.pump(1)
  pipe.pump(2)
  await delayPromise(delay / 2)
  expect(results).to.eql(expected[0])
  await delayPromise(delay)
  expect(results).to.eql(expected[1])
  await delayPromise(delay * 2)
  expect(results).to.eql(expected[2])

  await delayPromise(delay)
  expect(results).to.eql(expected[3])
  await delayPromise(delay * 2)
  expect(results).to.eql(expected[4])
}

describe('PromiseValves.Repeat.Backoff.Linear.js', () => {

  describe('MoonPipe.queueTap', () => {
    it('eventually succeeds', () => {
      return testInput('queueTap', [
        [
          'side_1',
        ],
        [
          'side_1',
          'side_1',
        ],
        [
          'side_1',
          'side_1',
          'side_1',
          'res_1',
          'side_2',
        ],
        [
          'side_1',
          'side_1',
          'side_1',
          'res_1',
          'side_2',
          'side_2',
        ],
        [
          'side_1',
          'side_1',
          'side_1',
          'res_1',
          'side_2',
          'side_2',
          'side_2',
          'res_2',
        ],
      ])
    })
  })
})
