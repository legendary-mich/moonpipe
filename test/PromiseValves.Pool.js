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
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .handleError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })
  pipe.pump(9)
  pipe.pump(8)
  pipe.pump(7)
  pipe.pump(6)
  pipe.pump(4)
  await delayPromise(400)
  expect(results).to.eql(expected)
}

describe('PromiseValves with a Pool.', () => {

  describe('MudPipe.poolTap', () => {
    it('runs 5 promisses concurrently when the poolSize is at 5', () => {
      return testInput('poolTap', 5, [
        'side_9',
        'side_8',
        'side_7',
        'side_6',
        'side_4',
        'res_4',
        'res_6',
        'res_7',
        'res_8',
        'res_9',
      ])
    })

    it('runs 3 promisses concurrently when the poolSize is at 3', () => {
      return testInput('poolTap', 3, [
        'side_9',
        'side_8',
        'side_7',
        'res_7',
        'side_6',
        'res_8',
        'side_4',
        'res_9',
        'res_4',
        'res_6',
      ])
    })
  })

  describe('MudPipe.poolMap', () => {
    it('runs 5 promisses concurrently when the poolSize is at 5', () => {
      return testInput('poolMap', 5, [
        'side_9',
        'side_8',
        'side_7',
        'side_6',
        'side_4',
        'res_104',
        'res_106',
        'res_107',
        'res_108',
        'res_109',
      ])
    })

    it('runs 3 promisses concurrently when the poolSize is at 3', () => {
      return testInput('poolMap', 3, [
        'side_9',
        'side_8',
        'side_7',
        'res_107',
        'side_6',
        'res_108',
        'side_4',
        'res_109',
        'res_104',
        'res_106',
      ])
    })
  })
})
