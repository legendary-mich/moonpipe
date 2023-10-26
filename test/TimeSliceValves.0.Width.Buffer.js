'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](0, 1)
    .queueTap(async (value) => {
      results.push('res_[' + value.join(',') + ']')
    })
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })
    .onBusyTap(async (value) => {
      results.push('on_busy_' + value)
    })
    .onIdle(async (value) => {
      results.push('on_idle_' + value)
    })

  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(3)

  await delayPromise(16)
  expect(results).to.eql(expected)
}

describe('TimeSliceValves with the chunkSize set to 0', () => {

  describe('MoonPipe.sliceEager', () => {
    it('pumps ORIGINAL values', () => {
      return testInput('sliceEager', [
        'on_busy_1',
        'res_[]',
        'res_[]',
        'res_[]',
        'on_idle_undefined',
      ])
    })
  })

  describe('MoonPipe.sliceLazy', () => {
    it('pumps MODIFIED values', () => {
      return testInput('sliceLazy', [
        'on_busy_1',
        'res_[]',
        'res_[]',
        'res_[]',
        'on_idle_undefined',
      ])
    })
  })
})