'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, valveName, cacheEnabled, expected) {
  const results = []
  const pipe = new MoonPipe()[method](async (value) => {
    results.push('side_' + value)
    await delayPromise(1)
    return value + 100
  }, {
    name: 'first valve',
    cache: cacheEnabled,
    hashFunction: (input) => 'derived_' + input,
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueTap(async () => {}, {
      name: 'third valve',
    })
    .queueEager(0)
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })

  pipe.pump(1)
  pipe.pump(2)
  pipe.cachePopulate(valveName, 1, 111)
  pipe.cachePopulate(valveName, 3, 333)
  await delayPromise(10)
  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(3)
  await delayPromise(10)
  expect(results).to.eql(expected)
}

describe('PromiseValves.WithCache.CachePopulate.js', () => {

  describe('MoonPipe.queueMap', () => {
    it('populates and overwrites the cache', () => {
      return testInput('queueMap', 'first valve', true, [
        'side_1',
        'res_101',
        'side_2',
        'res_102',
        'res_111',
        'res_102',
        'res_333',
      ])
    })

    it('populates the cache even if the "cache" is disabled', () => {
      return testInput('queueMap', 'first valve', false, [
        'side_1',
        'res_101',
        'side_2',
        'res_102',
        'res_111',
        'side_2',
        'res_102',
        'res_333',
      ])
    })

    it('does NOT populate the cache, because the third valve is irrelevant', () => {
      return testInput('queueMap', 'third valve', true, [
        'side_1',
        'res_101',
        'side_2',
        'res_102',
        'res_101',
        'res_102',
        'side_3',
        'res_103',
      ])
    })
  })

  describe('MoonPipe.queueTap', () => {
    it('populates and overwrites the cache',  () => {
      return testInput('queueTap', 'first valve', true, [
        'side_1',
        'res_1',
        'side_2',
        'res_2',
        'res_1',
        'res_2',
        'res_3',
      ])
    })

    it('does NOT populate the cache, because the third valve is irrelevant', () => {
      return testInput('queueTap', 'third valve', true, [
        'side_1',
        'res_1',
        'side_2',
        'res_2',
        'res_1',
        'res_2',
        'side_3',
        'res_3',
      ])
    })
  })
})
