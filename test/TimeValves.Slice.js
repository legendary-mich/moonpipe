'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, chunkSize, expected) {
  const results = []
  const pipe = new MoonPipe()[method](chunkSize, 10)
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })
    .onBusyTap(async (value) => {
      results.push('on_busy_' + value)
    })
    .onIdle(async () => {
      results.push('on_idle')
    })

  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(3)
  pipe.pump(4)
  pipe.pump(5)

  await delayPromise(5)
  expect(results).to.eql(expected[0])
  await delayPromise(10)
  expect(results).to.eql(expected[1])
  await delayPromise(10)
  expect(results).to.eql(expected[2])
  await delayPromise(10)
  expect(results).to.eql(expected[3])
}

describe('TimeValves Slice.', () => {

  describe('MoonPipe.sliceEager', () => {
    it('lets the first value slide, and than runs chunks of 5 when the chunk size is 5', () => {
      return testInput('sliceEager', 5, [
        ['on_busy_1', 'res_1'],
        ['on_busy_1', 'res_1', 'res_2,3,4,5'],
        ['on_busy_1', 'res_1', 'res_2,3,4,5', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_2,3,4,5', 'on_idle'],
      ])
    })

    it('lets the first value slide, and than runs chunks of 3 when the chunk size is 3', () => {
      return testInput('sliceEager', 3, [
        ['on_busy_1', 'res_1'],
        ['on_busy_1', 'res_1', 'res_2,3,4'],
        ['on_busy_1', 'res_1', 'res_2,3,4', 'res_5'],
        ['on_busy_1', 'res_1', 'res_2,3,4', 'res_5', 'on_idle'],
      ])
    })

    it('lets the first value slide, and than runs chunks of 2 when the chunk size is 2', () => {
      return testInput('sliceEager', 2, [
        ['on_busy_1', 'res_1'],
        ['on_busy_1', 'res_1', 'res_2,3'],
        ['on_busy_1', 'res_1', 'res_2,3', 'res_4,5'],
        ['on_busy_1', 'res_1', 'res_2,3', 'res_4,5', 'on_idle'],
      ])
    })
  })

  describe('MoonPipe.sliceLazy', () => {
    it('runs chunks of 5 when the chunk size is 5', () => {
      return testInput('sliceLazy', 5, [
        ['on_busy_1'],
        ['on_busy_1', 'res_1,2,3,4,5', 'on_idle'],
        ['on_busy_1', 'res_1,2,3,4,5', 'on_idle'],
        ['on_busy_1', 'res_1,2,3,4,5', 'on_idle'],
      ])
    })

    it('runs chunks of 3 when the chunk size is 3', () => {
      return testInput('sliceLazy', 3, [
        ['on_busy_1'],
        ['on_busy_1', 'res_1,2,3'],
        ['on_busy_1', 'res_1,2,3', 'res_4,5', 'on_idle'],
        ['on_busy_1', 'res_1,2,3', 'res_4,5', 'on_idle'],
      ])
    })

    it('runs chunks of 2 when the chunk size is 2', () => {
      return testInput('sliceLazy', 2, [
        ['on_busy_1' ],
        ['on_busy_1', 'res_1,2'],
        ['on_busy_1', 'res_1,2', 'res_3,4'],
        ['on_busy_1', 'res_1,2', 'res_3,4', 'res_5', 'on_idle'],
      ])
    })
  })
})
