'use strict'

const { expect } = require('chai')
const { MudPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, chunkSize, expected) {
  const results = []
  const pipe = new MudPipe()[method](chunkSize, async (value) => {
    results.push('side_' + value)
    return value + 100
  }, {
    cache: true,
    hashFunction: val => val.join(','),
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .handleError(async (err) => {
      results.push('err_' + err.message)
    })
  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(1)
  await delayPromise(50)
  expect(results).to.eql(expected)
}

describe('PromiseValves Sliced with Cache.', () => {

  describe('MudPipe.sliceTap', () => {
    it('runs chunks of 5 elements when the sliceSize is 5', () => {
      return testInput('sliceTap', 5, [
        'side_1,2,1,2,1',
        'res_1,2,1,2,1',
      ])
    })

    it('runs chunks of 3 when the sliceSize is 3', () => {
      return testInput('sliceTap', 3, [
        'side_1,2,1',
        'res_1,2,1',
        'side_2,1',
        'res_2,1',
      ])
    })

    it('runs chunks of 2 when the sliceSize is 2', () => {
      return testInput('sliceTap', 2, [
        'side_1,2',
        'res_1,2',
        // 'side_1,2',
        'side_1',
        'res_1,2',
        'res_1',
      ])
    })
  })

  describe('MudPipe.sliceMap', () => {
    it('runs chunks of 5 elements when the sliceSize is 5', () => {
      return testInput('sliceMap', 5, [
        'side_1,2,1,2,1',
        'res_1,2,1,2,1100',
      ])
    })

    it('runs chunks of 3 when the sliceSize is 3', () => {
      return testInput('sliceMap', 3, [
        'side_1,2,1',
        'res_1,2,1100',
        'side_2,1',
        'res_2,1100',
      ])
    })

    it('runs chunks of 2 when the sliceSize is 2', () => {
      return testInput('sliceMap', 2, [
        'side_1,2',
        'res_1,2100',
        // 'side_1,2',
        'side_1',
        'res_1,2100',
        'res_1100',
      ])
    })
  })
})
