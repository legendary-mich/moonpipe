'use strict'

const { expect } = require('chai')
const { MudPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, poolSize, expected) {
  const results = []
  const pipe = new MudPipe()[method](poolSize, async (value) => {
    results.push('side_' + value)
    await delayPromise(value * 10)
    return value + 100
  }, { timeoutMs: 40 }) // <---------- timeout is HERE
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .handleError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })
  pipe.pump(2)
  pipe.pump(6)
  pipe.pump(2)
  pipe.pump(6)
  pipe.pump(2)
  await delayPromise(400)
  expect(results).to.eql(expected)
}

describe('PromiseValves with a Pool and a Timeout.', () => {

  describe('MudPipe.poolTap', () => {
    it('runs 5 promisses concurrently when the poolSize is at 5', () => {
      return testInput('poolTap', 5, [
        'side_2',
        'side_6',
        'side_2',
        'side_6',
        'side_2',
        'res_2',
        'res_2',
        'res_2',
        'err_TimeoutError',
        'err_TimeoutError',
      ])
    })

    it('runs 3 promisses concurrently when the poolSize is at 3', () => {
      return testInput('poolTap', 3, [
        'side_2',
        'side_6',
        'side_2',
        'res_2',
        'side_6',
        'res_2',
        'side_2',
        'err_TimeoutError',
        'res_2',
        'err_TimeoutError',
      ])
    })
  })

  describe('MudPipe.poolMap', () => {
    it('runs 5 promisses concurrently when the poolSize is at 5', () => {
      return testInput('poolMap', 5, [
        'side_2',
        'side_6',
        'side_2',
        'side_6',
        'side_2',
        'res_102',
        'res_102',
        'res_102',
        'err_TimeoutError',
        'err_TimeoutError',
      ])
    })

    it('runs 3 promisses concurrently when the poolSize is at 3', () => {
      return testInput('poolMap', 3, [
        'side_2',
        'side_6',
        'side_2',
        'res_102',
        'side_6',
        'res_102',
        'side_2',
        'err_TimeoutError',
        'res_102',
        'err_TimeoutError',
      ])
    })
  })
})
