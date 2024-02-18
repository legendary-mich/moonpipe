'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, chunkSize, expected) {
  const results = []
  const pipe = new MoonPipe()[method](chunkSize, async (value) => {
    results.push('side_' + value)
    throw new Error(value + 100)
  })
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
  await delayPromise(5)
  expect(results).to.eql(expected)
}

describe('PromiseValves Sliced with an Error.', () => {

  describe('MoonPipe.sliceTap', () => {
    it('runs chunks of 5 elements when the sliceSize is 5', () => {
      return testInput('sliceTap', 5, [
        'side_9',
        'err_9100',
        'side_8,7,6,5',
        'err_8,7,6,5100',
      ])
    })

    it('runs chunks of 3 when the sliceSize is 3', () => {
      return testInput('sliceTap', 3, [
        'side_9',
        'err_9100',
        'side_8,7,6',
        'err_8,7,6100',
        'side_5',
        'err_5100',
      ])
    })

    it('runs chunks of 2 when the sliceSize is 2', () => {
      return testInput('sliceTap', 2, [
        'side_9',
        'err_9100',
        'side_8,7',
        'err_8,7100',
        'side_6,5',
        'err_6,5100',
      ])
    })
  })

  describe('MoonPipe.sliceMap', () => {
    it('runs chunks of 5 elements when the sliceSize is 5', () => {
      return testInput('sliceMap', 5, [
        'side_9',
        'err_9100',
        'side_8,7,6,5',
        'err_8,7,6,5100',
      ])
    })

    it('runs chunks of 3 when the sliceSize is 3', () => {
      return testInput('sliceMap', 3, [
        'side_9',
        'err_9100',
        'side_8,7,6',
        'err_8,7,6100',
        'side_5',
        'err_5100',
      ])
    })

    it('runs chunks of 2 when the sliceSize is 2', () => {
      return testInput('sliceMap', 2, [
        'side_9',
        'err_9100',
        'side_8,7',
        'err_8,7100',
        'side_6,5',
        'err_6,5100',
      ])
    })
  })
})
