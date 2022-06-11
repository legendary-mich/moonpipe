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
  })
    .queueTap(async (value) => {
      results.push('err_' + value)
    })
    .queueError(async (err) => {
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

describe('PromiseValves with a Pool and Error.', () => {

  describe('MudPipe.poolTap', () => {
    it('runs 5 promisses concurrently when the poolSize is at 5', () => {
      return testInput('poolTap', 5, [
        'side_9',
        'side_8',
        'side_7',
        'side_6',
        'side_4',
        'err_104',
        'err_106',
        'err_107',
        'err_108',
        'err_109',
      ])
    })

    it('runs 3 promisses concurrently when the poolSize is at 3', () => {
      return testInput('poolTap', 3, [
        'side_9',
        'side_8',
        'side_7',
        'err_107',
        'side_6',
        'err_108',
        'side_4',
        'err_109',
        'err_104',
        'err_106',
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
        'err_104',
        'err_106',
        'err_107',
        'err_108',
        'err_109',
      ])
    })

    it('runs 3 promisses concurrently when the poolSize is at 3', () => {
      return testInput('poolMap', 3, [
        'side_9',
        'side_8',
        'side_7',
        'err_107',
        'side_6',
        'err_108',
        'side_4',
        'err_109',
        'err_104',
        'err_106',
      ])
    })
  })
})
