'use strict'

const { expect } = require('chai')
const { MudPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

describe('MudPipe.Cache', () => {

  async function testInput(method, expected) {
    let side_1 = []
    let side_2 = []
    let result = []
    const mp = new MudPipe()
      .queueTap(async (value) => {
        side_1.push(value)
      }, { cache: true})
      .queueTap(async (value) => {
        side_2.push(value)
      }, { cache: true })
      .queueTap(async (value) => {
        result.push(value)
      })

    mp.pump(10)
    mp.pump(20)
    mp.pump(30)
    mp.pump(40)
    mp.pump(null)
    mp.pump(undefined)

    await delayPromise(5)
    expect(side_1).to.eql([10, 20, 30, 40, null, undefined])
    expect(side_2).to.eql([10, 20, 30, 40, null, undefined])
    expect(result).to.eql([10, 20, 30, 40, null, undefined])

    // -------------------------------------------------------------------------

    method(mp)

    side_1 = []
    side_2 = []
    result = []

    mp.pump(10)
    mp.pump(20)
    mp.pump(30)
    mp.pump(40)
    mp.pump(null)
    mp.pump(undefined)

    await delayPromise(5)
    expect(side_1).to.eql(expected[0])
    expect(side_2).to.eql(expected[1])
    expect(result).to.eql(expected[2])
  }

  describe('ClearOne at 0', () => {
    it('clears out the cache in the first valve', () => {
      return testInput(mp => mp.cacheClearOne(0), [
        [10, 20, 30, 40, null, undefined],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the first valve at key 10', () => {
      return testInput(mp => mp.cacheClearOne(0, 10), [
        [10],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the first valve at key 30', () => {
      return testInput(mp => mp.cacheClearOne(0, 30), [
        [30],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the first valve at keys 20 and 40', () => {
      return testInput(mp => mp.cacheClearOne(0, 20, 40), [
        [20, 40],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })
  })

  describe('ClearOne at 1', () => {
    it('clears out the cache in the second valve', async () => {
      return testInput(mp => mp.cacheClearOne(1), [
        [],
        [10, 20, 30, 40, null, undefined],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at key 20', async () => {
      return testInput(mp => mp.cacheClearOne(1, 20), [
        [],
        [20],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at key 40', async () => {
      return testInput(mp => mp.cacheClearOne(1, 40), [
        [],
        [40],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at keys 10 and 30', async () => {
      return testInput(mp => mp.cacheClearOne(1, 10, 30), [
        [],
        [10, 30],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at key null', async () => {
      return testInput(mp => mp.cacheClearOne(1, null), [
        [],
        [null],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at key undefined', async () => {
      return testInput(mp => mp.cacheClearOne(1, undefined), [
        [],
        [undefined],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at keys undefined, null, and 20', async () => {
      return testInput(mp => mp.cacheClearOne(1, undefined, null, 20), [
        [],
        [20, null, undefined],
        [10, 20, 30, 40, null, undefined],
      ])
    })
  })

  describe('ClearOne at 0 with a custom hashFunction', () => {
    it('clears out the cache in the first valve at the key derived from 20', async () => {
      let side_1 = []
      let side_2 = []
      let result = []
      const mp = new MudPipe()
        .queueTap(async (value) => {
          side_1.push(value)
        }, {
          cache: true,
          hashFunction: (value) => {
            if (value === 20 || value === 40) return 'zz'
            else return value
          },
        })
        .queueTap(async (value) => {
          result.push(value)
        })

      mp.pump(10)
      mp.pump(20)
      mp.pump(30)
      mp.pump(40)

      await delayPromise(5)
      expect(side_1).to.eql([10, 20, 30])
      expect(result).to.eql([10, 20, 30, 20])

      // -------------------------------------------------------------------------

      mp.cacheClearOne(0, 20)

      side_1 = []
      side_2 = []
      result = []

      mp.pump(10)
      mp.pump(20)
      mp.pump(30)
      mp.pump(40)

      await delayPromise(5)
      expect(side_1).to.eql([20])
      expect(side_2).to.eql([])
      expect(result).to.eql([10, 20, 30, 20])
    })
  })

  describe('ClearAll', () => {
    it('clears out both valves', async () => {
      return testInput(mp => mp.cacheClearAll(), [
        [10, 20, 30, 40, null, undefined],
        [10, 20, 30, 40, null, undefined],
        [10, 20, 30, 40, null, undefined],
      ])
    })
  })
})
