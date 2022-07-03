'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, chunkSize, expected) {
  const results = []
  const pipe = new MoonPipe()[method](chunkSize, async (value) => {
    results.push('side_' + value)
    await delayPromise(20)
    return value + 100
  }, {timeoutMs:10})
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      results.push('err_' + err.message)
    })
  pipe.pump(9)
  pipe.pump(8)
  pipe.pump(7)
  pipe.pump(6)
  pipe.pump(5)
  await delayPromise(100)
  expect(results).to.eql(expected)
}

describe('PromiseValves Sliced with Timeout.', () => {

  describe('MoonPipe.sliceTap', () => {
    it('runs chunks of 5 elements when the sliceSize is 5', () => {
      return testInput('sliceTap', 5, [
        'side_9,8,7,6,5',
        'err_TimeoutError',
      ])
    })

    it('runs chunks of 3 when the sliceSize is 3', () => {
      return testInput('sliceTap', 3, [
        'side_9,8,7',
        'err_TimeoutError',
        'side_6,5',
        'err_TimeoutError',
      ])
    })

    it('runs chunks of 2 when the sliceSize is 2', () => {
      return testInput('sliceTap', 2, [
        'side_9,8',
        'err_TimeoutError',
        'side_7,6',
        'err_TimeoutError',
        'side_5',
        'err_TimeoutError',
      ])
    })
  })

  describe('MoonPipe.sliceMap', () => {
    it('runs chunks of 5 elements when the sliceSize is 5', () => {
      return testInput('sliceMap', 5, [
        'side_9,8,7,6,5',
        'err_TimeoutError',
      ])
    })

    it('runs chunks of 3 when the sliceSize is 3', () => {
      return testInput('sliceMap', 3, [
        'side_9,8,7',
        'err_TimeoutError',
        'side_6,5',
        'err_TimeoutError',
      ])
    })

    it('runs chunks of 2 when the sliceSize is 2', () => {
      return testInput('sliceMap', 2, [
        'side_9,8',
        'err_TimeoutError',
        'side_7,6',
        'err_TimeoutError',
        'side_5',
        'err_TimeoutError',
      ])
    })
  })
})
