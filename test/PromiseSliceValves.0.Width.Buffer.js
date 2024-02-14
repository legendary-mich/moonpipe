'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](0, async (value) => {
    results.push('side_[' + value.join(',') + ']')
    await delayPromise(1)
    return value.concat(100)
  })
    .queueTap(async (value) => {
      results.push('res_[' + value.join(',') + ']')
    })
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })
    .onBusy(() => {
      results.push('on_busy')
    })
    .onIdle(() => {
      results.push('on_idle')
    })

  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(3)

  await delayPromise(16)
  expect(results).to.eql(expected)
}

describe('PromiseSliceValves with the chunkSize set to 0', () => {

  describe('MoonPipe.sliceTap', () => {
    it('pumps ORIGINAL values', () => {
      return testInput('sliceTap', [
        'on_busy',
        'side_[]',
        'res_[]',
        'side_[]',
        'res_[]',
        'side_[]',
        'res_[]',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.sliceMap', () => {
    it('pumps MODIFIED values', () => {
      return testInput('sliceMap', [
        'on_busy',
        'side_[]',
        'res_[100]',
        'side_[]',
        'res_[100]',
        'side_[]',
        'res_[100]',
        'on_idle',
      ])
    })
  })
})
