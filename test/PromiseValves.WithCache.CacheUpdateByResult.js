'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, transformFunc, expected) {
  const results = []
  const pipe = new MoonPipe()[method](async (value) => {
    results.push('side_' + value)
    await delayPromise(1)
    return value + 100
  }, {
    name: 'first valve',
    cache: true,
    hashFunction: (input) => 'derived_' + input,
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
  pipe.cacheUpdateByResult('first valve', transformFunc)
  pipe.pump(1)
  pipe.pump(2)
  await delayPromise(10)
  expect(results).to.eql(expected)
}

describe('PromiseValves.WithCache.CacheUpdateByResult.js', () => {

  describe('MoonPipe.queueMap', () => {
    it('updates the cache by the VALUE', () => {
      return testInput('queueMap',
        (val, key) => val === 101 ? 'transformed_101' : val,
        [
          'side_1',
          'res_101',
          'side_2',
          'res_102',
          'res_transformed_101',
          'res_102',
        ])
    })

    it('updates the cache by the KEY', () => {
      return testInput('queueMap',
        (val, key) => key === 'derived_1' ? 'transformed_101' : val,
        [
          'side_1',
          'res_101',
          'side_2',
          'res_102',
          'res_transformed_101',
          'res_102',
        ])
    })

    it('does NOT update the cache by the VALUE', () => {
      return testInput('queueMap',
        (val, key) => val === 1 ? 'transformed_1' : val,
        [
          'side_1',
          'res_101',
          'side_2',
          'res_102',
          'res_101',
          'res_102',
        ])
    })

    it('does NOT update the cache by the KEY', () => {
      return testInput('queueMap',
        (val, key) => key === 'derived_101' ? 'transformed_101' : val,
        [
          'side_1',
          'res_101',
          'side_2',
          'res_102',
          'res_101',
          'res_102',
        ])
    })
  })

  describe('MoonPipe.queueTap', () => {
    it('responds with the pumped value. The state of the cache is unknown', () => {
      return testInput('queueTap',
        (val, key) => val === 101 ? 'transformed_1' : val,
        [
          'side_1',
          'res_1',
          'side_2',
          'res_2',
          'res_1',
          'res_2',
        ])
    })

    it('responds with the pumped value. The state of the cache is unknown', () => {
      return testInput('queueTap',
        (val, key) => key === 'derived_1' ? 'transformed_1' : val,
        [
          'side_1',
          'res_1',
          'side_2',
          'res_2',
          'res_1',
          'res_2',
        ])
    })

    it('responds with the pumped value. The state of the cache is unknown', () => {
      return testInput('queueTap',
        (val, key) => val === 1 ? 'transformed_101' : val,
        [
          'side_1',
          'res_1',
          'side_2',
          'res_2',
          'res_1',
          'res_2',
        ])
    })

    it('responds with the pumped value. The state of the cache is unknown', () => {
      return testInput('queueTap',
        (val, key) => key === 'derived_101' ? 'transformed_101' : val,
        [
          'side_1',
          'res_1',
          'side_2',
          'res_2',
          'res_1',
          'res_2',
        ])
    })
  })

  describe('Invalid predicateFunc', () => {
    it('throws an error', async () => {
      const results = []
      const pipe = new MoonPipe()
        .queueMap(async val => val, {
          name: 'first valve',
          cache: true,
        })
        .queueTap(async (value) => {
          results.push('res_' + value)
        })
        .queueError(async (err) => {
          results.push('err_' + err.message)
        })

      pipe.pump(1)
      pipe.pump(2)
      try {
        pipe.cacheUpdateByResult('first valve', 44)
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', `Unexpected 'transformFunc': 44`)
      }
      await delayPromise(2)
      expect(results).to.eql(['res_1', 'res_2'])
    })
  })
})
