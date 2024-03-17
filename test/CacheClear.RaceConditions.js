'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  let counter = 0
  const mp = new MoonPipe()
    .queueMap(async (value) => {
      results.push('side_' + value)
      await delayPromise(5)
      return ++counter
    }, {
      cache: true,
      name: 'racer',
    })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      results.push('err_' + err.message)
    })

  mp.pump('c')
  results.push('clear'); method(mp)
  mp.pump('c')
  await delayPromise(15)
  expect(results).to.eql(expected)
}

describe('CacheClear.RaceConditions.js', () => {

  describe('cacheClearAll', () => {
    it('clears the cache after the first promise settles', () => {
      return testInput(mp => mp.cacheClearAll(), [
        'side_c',
        'clear',
        'res_1',
        'side_c',
        'res_2',
      ])
    })
  })

  describe('cacheClearOne', () => {
    it('clears the cache after the first promise settles', () => {
      return testInput(mp => mp.cacheClearOne('racer', 'c'), [
        'side_c',
        'clear',
        'res_1',
        'side_c',
        'res_2',
      ])
    })
  })

  describe('cacheClearByResult', () => {
    it('clears the cache after the first promise settles', () => {
      return testInput(mp => mp.cacheClearByResult('racer', () => true), [
        'side_c',
        'clear',
        'res_1',
        'side_c',
        'res_2',
      ])
    })

    it('handles errors gracefully', () => {
      return testInput(mp => mp.cacheClearByResult('racer', () => {
        throw new Error('oops!')
      }), [
        'side_c',
        'clear',
        'res_1',
        'err_oops!',
        'res_1',
      ])
    })
  })

  describe('cacheUpdateByResult', () => {
    it('updates the cache after the first promise settles', () => {
      return testInput(mp => mp.cacheUpdateByResult('racer', () => true), [
        'side_c',
        'clear',
        'res_1',
        'res_true',
      ])
    })

    it('handles errors gracefully', () => {
      return testInput(mp => mp.cacheUpdateByResult('racer', () => {
        throw new Error('oops!')
      }), [
        'side_c',
        'clear',
        'res_1',
        'err_oops!',
        'res_1',
      ])
    })
  })

  describe('with a pool', () => {

    async function testInput(method, expected) {
      const results = []
      let counter = 0
      const mp = new MoonPipe()
        .poolMap(2, async (value) => {
          results.push('side_' + value)
          await delayPromise(5)
          return value + '_' + (++counter)
        }, {
          cache: true,
          name: 'racer',
        })
        .queueTap(async (value) => {
          results.push('ress_' + value)
        })
        .queueError(async (err) => {
          results.push('err_' + err.message)
        })

      mp.pump('a')
      mp.pump('b')
      results.push('clear'); method(mp)
      mp.pump('a')
      mp.pump('b')
      await delayPromise(20)
      expect(results).to.eql(expected)
    }

    it('clears the cache after both promises in the pool settle', () => {
      return testInput(mp => mp.cacheClearAll(), [
        'side_a',
        'side_b',
        'clear',
        'ress_a_1',
        'ress_b_2',
        'side_a',
        'side_b',
        'ress_a_3',
        'ress_b_4',

        // This is what happens when the cache is invalidated before
        // responses from 'a' and 'b' get cached.
        // 'side_a',
        // 'side_b',
        // 'clear',
        // 'ress_a_1',
        // 'ress_b_2',
        // 'ress_a_1',
        // 'ress_b_2',
      ])
    })
  })

  describe('with a cancel valve', () => {

    async function testInput(method, expected) {
      const results = []
      let counter = 0
      const mp = new MoonPipe()
        .cancelMap(async (value) => {
          results.push('side_' + value)
          await delayPromise(5)
          return value + '_' + (++counter)
        }, {
          cache: true,
          name: 'racer',
        })
        .queueTap(async (value) => {
          results.push('ress_' + value)
        })
        .queueError(async (err) => {
          results.push('err_' + err.message)
        })

      mp.pump('a')
      results.push('clear'); method(mp)
      mp.pump('b')
      await delayPromise(20)
      expect(results).to.eql(expected)
    }

    it('does not prevent cancellation', () => {
      return testInput(mp => mp.cacheClearAll(), [
        'side_a',
        'clear',
        'side_b',
        'ress_b_2',
      ])
    })
  })
})
