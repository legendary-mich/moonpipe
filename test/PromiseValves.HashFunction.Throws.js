'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](async (value) => {
    results.push('side_' + value)
    return value + 100
  }, {
    cache: true,
    hashFunction: () => { throw new Error('holo') },
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      results.push('err_' + err.message)
    })

  pipe.pump(1)
  await delayPromise(5)
  expect(results).to.eql(expected)
}

describe('PromiseValves.HashFunction.Throws.js', () => {

  describe('MoonPipe.queueTap', () => {
    it('catches an error thrown by the hash function', () => {
      return testInput('queueTap', [
        'err_holo',
      ])
    })
  })

  describe('cacheClearOne', () => {
    it('catches errors thrown by the hash function', async () => {
      const results = []
      const pipe = new MoonPipe().queueMap(async (value) => {
        results.push('side_' + value)
        return value + 100
      }, {
        name: 'zozo',
        cache: true,
        hashFunction: (val) => { throw new Error('holo_' + val) },
      })
        .queueTap(async (value) => {
          results.push('res_' + value)
        })
        .queueError(async (err) => {
          results.push('err_' + err.message)
        })

      pipe.cacheClearOne('zozo', 1)
      pipe.pump(2)
      await delayPromise(5)
      expect(results).to.eql([
        'err_holo_1',
        'err_holo_2',
      ])
    })
  })

  describe('cachePopulate', () => {
    it('catches errors thrown by the hash function', async () => {
      const results = []
      const pipe = new MoonPipe().queueMap(async (value) => {
        results.push('side_' + value)
        return value + 100
      }, {
        name: 'zozo',
        cache: true,
        hashFunction: (val) => { throw new Error('holo_' + val) },
      })
        .queueTap(async (value) => {
          results.push('res_' + value)
        })
        .queueError(async (err) => {
          results.push('err_' + err.message)
        })

      pipe.cachePopulate('zozo', 1, 2)
      pipe.pump(3)
      await delayPromise(5)
      expect(results).to.eql([
        'err_holo_1',
        'err_holo_3',
      ])
    })
  })
})
