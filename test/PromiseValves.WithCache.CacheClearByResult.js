'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, predicateFunc, expected) {
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
  pipe.cacheClearByResult('first valve', predicateFunc)
  pipe.pump(1)
  pipe.pump(2)
  await delayPromise(10)
  expect(results).to.eql(expected)
}

describe('PromiseValves.WithCache.CacheClearByResult.js', () => {

  describe('MoonPipe.queueTap', () => {
    it('clears the cache by the VALUE', () => {
      return testInput('queueTap', (val, key) => val === 1, [
        'side_1',
        'res_1',
        'side_2',
        'res_2',
        'side_1',
        'res_1',
        'res_2',
      ])
    })

    it('clears the cache by the KEY', () => {
      return testInput('queueTap', (val, key) => key === 'derived_1', [
        'side_1',
        'res_1',
        'side_2',
        'res_2',
        'side_1',
        'res_1',
        'res_2',
      ])
    })

    it('does NOT clear the cache by the VALUE', () => {
      return testInput('queueTap', (val, key) => val === 14000, [
        'side_1',
        'res_1',
        'side_2',
        'res_2',
        'res_1',
        'res_2',
      ])
    })

    it('does NOT clear the cache by the KEY', () => {
      return testInput('queueTap', (val, key) => key === 'derived_14000', [
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
        .queueTap(async val => val, {
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
        pipe.cacheClearByResult('first valve', 33)
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', `Unexpected 'predicateFunc': 33`)
      }
      await delayPromise(2)
      expect(results).to.eql(['res_1', 'res_2'])
    })
  })
})
