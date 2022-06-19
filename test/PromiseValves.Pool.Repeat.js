'use strict'

const { expect } = require('chai')
const { MudPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, poolSize, expected) {
  const results = []
  const pipe = new MudPipe()[method](poolSize, async (value) => {
    results.push('side_' + value)
    await delayPromise(value * 10)
    throw new Error(value + 100)
  }, {
    repeatPredicate: (attemptsMade, err) => {
      return err && attemptsMade <= 1
    },
  })
    .queueTap(async (value) => {
      results.push('err_' + value)
    })
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })
  pipe.pump(6)
  pipe.pump(2)
  pipe.pump(6)
  await delayPromise(500)
  expect(results).to.eql(expected)
}

describe('PromiseValves with a Pool and Repeat.', () => {

  describe('MudPipe.poolTap', () => {
    it('runs 3 promisses concurrently when the poolSize is at 3', () => {
      return testInput('poolTap', 3, [
        'side_6',
        'side_2',
        'side_6',
        'side_2',
        'err_102',
        'side_6',
        'side_6',
        'err_106',
        'err_106',
      ])
    })

    it('runs 2 promisses concurrently when the poolSize is at 2', () => {
      return testInput('poolTap', 2, [
        'side_6',
        'side_2',
        'side_2',
        'err_102',
        'side_6',
        'side_6',
        'side_6',
        'err_106',
        'err_106',
      ])
    })
  })

  describe('MudPipe.poolMap', () => {
    it('runs 3 promisses concurrently when the poolSize is at 3', () => {
      return testInput('poolMap', 3, [
        'side_6',
        'side_2',
        'side_6',
        'side_2',
        'err_102',
        'side_6',
        'side_6',
        'err_106',
        'err_106',
      ])
    })

    it('runs 2 promisses concurrently when the poolSize is at 2', () => {
      return testInput('poolMap', 2, [
        'side_6',
        'side_2',
        'side_2',
        'err_102',
        'side_6',
        'side_6',
        'side_6',
        'err_106',
        'err_106',
      ])
    })
  })
})
