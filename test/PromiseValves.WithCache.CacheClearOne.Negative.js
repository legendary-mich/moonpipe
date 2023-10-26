'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](async (value) => {
    results.push('side_' + value)
    await delayPromise(1)
    return value + 100
  }, {
    name: '1st',
    cache: true,
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueEager(0)
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })

  pipe.pump(1)
  await delayPromise(10)
  pipe.pump(2)
  await delayPromise(10)
  pipe.cacheClearOne('1st', 800)
  pipe.pump(1)
  await delayPromise(10)
  expect(results).to.eql(expected)
}

describe('PromiseValves with Cache, CacheClearOne, Negative.', () => {

  describe('MoonPipe.queueTap', () => {
    it('pumps ORIGINAL values', () => {
      return testInput('queueTap', [
        'side_1',
        'res_1',
        'side_2',
        'res_2',
        'res_1',
      ])
    })
  })

  describe('MoonPipe.queueMap', () => {
    it('pumps MODIFIED values', () => {
      return testInput('queueMap', [
        'side_1',
        'res_101',
        'side_2',
        'res_102',
        'res_101',
      ])
    })
  })

  describe('MoonPipe.cancelTap', () => {
    it('cancels initial promises, and resolves the last one with the ORIGINAL value', () => {
      return testInput('cancelTap', [
        'side_1',
        'res_1',
        'side_2',
        'res_2',
        'res_1',
      ])
    })
  })

  describe('MoonPipe.cancelMap', () => {
    it('cancels initial promises, and resolves the last one with a MODIFIED value', () => {
      return testInput('cancelMap', [
        'side_1',
        'res_101',
        'side_2',
        'res_102',
        'res_101',
      ])
    })
  })

  describe('MoonPipe.throttleTap', () => {
    it('removes values which are waiting in the queue, and pumps ORIGINAL ones', () => {
      return testInput('throttleTap', [
        'side_1',
        'res_1',
        'side_2',
        'res_2',
        'res_1',
      ])
    })
  })

  describe('MoonPipe.throttleMap', () => {
    it('removes values which are waiting in the queue, and pumps MODIFIED ones', () => {
      return testInput('throttleMap', [
        'side_1',
        'res_101',
        'side_2',
        'res_102',
        'res_101',
      ])
    })
  })

  describe('MoonPipe.skipTap', () => {
    it('whatever', () => {
      return testInput('skipTap', [
        'side_1',
        'res_1',
        'side_2',
        'res_2',
        'res_1',
      ])
    })
  })

  describe('MoonPipe.skipMap', () => {
    it('whatever', () => {
      return testInput('skipMap', [
        'side_1',
        'res_101',
        'side_2',
        'res_102',
        'res_101',
      ])
    })
  })
})
