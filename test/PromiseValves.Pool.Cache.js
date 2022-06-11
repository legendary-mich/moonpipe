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
  }, { cache: true }) // <------------ cache is HERE
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })
  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(1)
  await delayPromise(400)
  expect(results).to.eql(expected)
}

describe('PromiseValves with a Pool and Cache.', () => {

  describe('MudPipe.poolTap', () => {
    it('runs 5 promisses concurrently when the poolSize is at 5', () => {
      return testInput('poolTap', 5, [
        'side_1',
        'side_2',
        'side_1',
        'side_2',
        'side_1',
        'res_1',
        'res_1',
        'res_1',
        'res_2',
        'res_2',
      ])
    })

    it('runs 3 promisses concurrently when the poolSize is at 3', () => {
      return testInput('poolTap', 3, [
        'side_1',
        'side_2',
        'side_1',
        'res_1',
        'side_2',
        'res_1',
        'res_1',
        'res_2',
        'res_2',
      ])
    })
  })

  describe('MudPipe.poolMap', () => {
    it('runs 5 promisses concurrently when the poolSize is at 5', () => {
      return testInput('poolMap', 5, [
        'side_1',
        'side_2',
        'side_1',
        'side_2',
        'side_1',
        'res_101',
        'res_101',
        'res_101',
        'res_102',
        'res_102',
      ])
    })

    it('runs 3 promisses concurrently when the poolSize is at 3', () => {
      return testInput('poolMap', 3, [
        'side_1',
        'side_2',
        'side_1',
        'res_101',
        'side_2',
        'res_101',
        'res_101',
        'res_102',
        'res_102',
      ])
    })
  })
})
