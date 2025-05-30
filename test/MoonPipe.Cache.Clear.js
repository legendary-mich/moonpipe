'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

describe('MoonPipe.Cache', () => {

  async function testInput(method, expected) {
    let side_1 = []
    let side_2 = []
    let result = []
    const mp = new MoonPipe()
      .queueTap(async (value) => {
        side_1.push(value)
      }, { cache: true, name: '1st' })
      .queueTap(async (value) => {
        side_2.push(value)
      }, { cache: true, name: '2nd' })
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
      return testInput(mp => mp.cacheClearOne('1st'), [
        [10, 20, 30, 40, null, undefined],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the first valve at key 10', () => {
      return testInput(mp => mp.cacheClearOne('1st', 10), [
        [10],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the first valve at key 30', () => {
      return testInput(mp => mp.cacheClearOne('1st', 30), [
        [30],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the first valve at keys 20 and 40', () => {
      return testInput(mp => mp.cacheClearOne('1st', 20, 40), [
        [20, 40],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })
  })

  describe('ClearOne at 1', () => {
    it('clears out the cache in the second valve', async () => {
      return testInput(mp => mp.cacheClearOne('2nd'), [
        [],
        [10, 20, 30, 40, null, undefined],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at key 20', async () => {
      return testInput(mp => mp.cacheClearOne('2nd', 20), [
        [],
        [20],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at key 40', async () => {
      return testInput(mp => mp.cacheClearOne('2nd', 40), [
        [],
        [40],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at keys 10 and 30', async () => {
      return testInput(mp => mp.cacheClearOne('2nd', 10, 30), [
        [],
        [10, 30],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at key null', async () => {
      return testInput(mp => mp.cacheClearOne('2nd',  null), [
        [],
        [null],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at key undefined', async () => {
      return testInput(mp => mp.cacheClearOne('2nd', undefined), [
        [],
        [undefined],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at keys undefined, null, and 20', async () => {
      return testInput(mp => mp.cacheClearOne('2nd', undefined, null, 20), [
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
      const mp = new MoonPipe()
        .queueMap(async (value) => {
          side_1.push(value)
          return value
        }, {
          name: '1st',
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

      mp.cacheClearOne('1st', 20)

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

describe('MoonPipe.Cache with Splitter', () => {

  async function testInput(method, expected) {
    let side_1 = []
    let side_2 = []
    let side_3 = []
    let result = []
    const mp = new MoonPipe()
      .splitBy(1, () => 'wahtever', { name: 'splitter' })
      .queueMap(async (value) => {
        side_1.push(value)
        return value
      }, { cache: true, name: 's-1st' })
      .queueMap(async (value) => {
        side_2.push(value)
        return value
      }, { cache: true, name: 's-2nd', hashFunction: (val) => 'derived_' +  val })
      .join()
      .queueMap(async (value) => {
        side_3.push(value)
        return value
      }, { cache: true, name: 'map-1st' })
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
    expect(side_3).to.eql([10, 20, 30, 40, null, undefined])
    expect(result).to.eql([10, 20, 30, 40, null, undefined])

    // -------------------------------------------------------------------------

    method(mp)

    side_1 = []
    side_2 = []
    side_3 = []
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
    expect(side_3).to.eql(expected[2])
    expect(result).to.eql(expected[3])
  }

  describe('Sibling PromiseValves', () => {
    // Long time ago, the cache in splitters was deterministic, and this test
    // used to verify that. Now, after removing the determinism, it is perhaps
    // useless, but I leave it setting the concurrency param to 1, so that I
    // don't have to remove it.
    it('the CACHE is NONDETERMINISTIC unless the concurrency is set to 1', async () => {
      const side = []
      const results = []
      const mp = new MoonPipe()
        .splitBy(1, (val) => val%2) // <--- concurrency set to 1
        .queueTap((value) => {
          side.push(value)
        }, { cache:  true })
        .join()
        .queueTap((value) => {
          results.push(value)
        })

      mp.pump(0)
      mp.pump(1)
      mp.pump(2)
      mp.pump(3)
      for (let i = 0; i < 36; ++i) {
        mp.pump(Math.floor(Math.random() * 4))
        await delayPromise(1)
      }
      await delayPromise(20)
      expect(results).to.have.lengthOf(40)
      expect(side).to.eql([0, 2, 1, 3])
    })
  })

  describe('ClearOne at 0 - meaning wipe out the whole Splitter', () => {
    it('clears out the cache in the whole Splitter', () => {
      return testInput(mp => mp.cacheClearOne('splitter'), [
        [10, 20, 30, 40, null, undefined],
        [10, 20, 30, 40, null, undefined],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the whole Splitter regardles of key 10', () => {
      return testInput(mp => mp.cacheClearOne('splitter', 10), [
        [10, 20, 30, 40, null, undefined],
        [10, 20, 30, 40, null, undefined],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the whole Splitter regardles of key 30', () => {
      return testInput(mp => mp.cacheClearOne('splitter', 30), [
        [10, 20, 30, 40, null, undefined],
        [10, 20, 30, 40, null, undefined],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the whole Splitter regardles of keys 20 and 40', () => {
      return testInput(mp => mp.cacheClearOne('splitter', 20, 40), [
        [10, 20, 30, 40, null, undefined],
        [10, 20, 30, 40, null, undefined],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('throws for the cacheClearByResult', () => {
      return testInput(mp => {
        try {
          mp.cacheClearByResult('splitter', (value, key) => true)
          throw new Error('should have thrown')
        }
        catch (err) {
          expect(err).to.have.property('message', 'cacheClearByResult is not supported on Splitters')
        }
      }, [
        [],
        [],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('throws for the cacheUpdateByResult', () => {
      return testInput(mp => {
        try {
          mp.cacheUpdateByResult('splitter', (value, key) => null)
          throw new Error('should have thrown')
        }
        catch (err) {
          expect(err).to.have.property('message', 'cacheUpdateByResult is not supported on Splitters')
        }
      }, [
        [],
        [],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('throws for the cachePopulate', () => {
      return testInput(mp => {
        try {
          mp.cachePopulate('splitter', 10, 20)
          throw new Error('should have thrown')
        }
        catch (err) {
          expect(err).to.have.property('message', 'cachePopulate is not supported on Splitters')
        }
      }, [
        [],
        [],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })
  })

  describe('ClearOne at 1', () => {
    it('clears out the cache in the first valve', async () => {
      return testInput(mp => mp.cacheClearOne('s-1st'), [
        [10, 20, 30, 40, null, undefined],
        [],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the first valve at key 20', async () => {
      return testInput(mp => mp.cacheClearOne('s-1st', 20), [
        [20],
        [],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the first valve at key 40', async () => {
      return testInput(mp => mp.cacheClearOne('s-1st', 40), [
        [40],
        [],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the first valve at keys 10 and 30', async () => {
      return testInput(mp => mp.cacheClearOne('s-1st', 10, 30), [
        [10, 30],
        [],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the first valve at key null', async () => {
      return testInput(mp => mp.cacheClearOne('s-1st', null), [
        [null],
        [],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the first valve at key undefined', async () => {
      return testInput(mp => mp.cacheClearOne('s-1st', undefined), [
        [undefined],
        [],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the first valve at keys undefined, null, and 20', async () => {
      return testInput(mp => mp.cacheClearOne('s-1st', undefined, null, 20), [
        [20, null, undefined],
        [],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })
  })

  describe('ClearOne at 2', () => {
    it('clears out the cache in the second valve', async () => {
      return testInput(mp => mp.cacheClearOne('s-2nd'), [
        [],
        [10, 20, 30, 40, null, undefined],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at key 20', async () => {
      return testInput(mp => mp.cacheClearOne('s-2nd', 20), [
        [],
        [20],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at key 40', async () => {
      return testInput(mp => mp.cacheClearOne('s-2nd', 40), [
        [],
        [40],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at keys 10 and 30', async () => {
      return testInput(mp => mp.cacheClearOne('s-2nd', 10, 30), [
        [],
        [10, 30],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at key null', async () => {
      return testInput(mp => mp.cacheClearOne('s-2nd', null), [
        [],
        [null],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at key undefined', async () => {
      return testInput(mp => mp.cacheClearOne('s-2nd', undefined), [
        [],
        [undefined],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at keys undefined, null, and 20', async () => {
      return testInput(mp => mp.cacheClearOne('s-2nd', undefined, null, 20), [
        [],
        [20, null, undefined],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })
  })

  describe('ClearOne at 3', () => {
    it('clears out the cache in the third valve', async () => {
      return testInput(mp => mp.cacheClearOne('map-1st'), [
        [],
        [],
        [10, 20, 30, 40, null, undefined],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the third valve at key 20', async () => {
      return testInput(mp => mp.cacheClearOne('map-1st', 20), [
        [],
        [],
        [20],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the third valve at key 40', async () => {
      return testInput(mp => mp.cacheClearOne('map-1st', 40), [
        [],
        [],
        [40],
        [10, 20, 30, 40, null, undefined],
      ])
    })
  })

  describe('ClearAll', () => {
    it('clears out all valves', async () => {
      return testInput(mp => mp.cacheClearAll(), [
        [10, 20, 30, 40, null, undefined],
        [10, 20, 30, 40, null, undefined],
        [10, 20, 30, 40, null, undefined],
        [10, 20, 30, 40, null, undefined],
      ])
    })
  })

  describe('ClearByResult at 2', () => {
    it('clears out the cache in the second valve', async () => {
      return testInput(mp => mp.cacheClearByResult('s-2nd', (res, key) => true), [
        [],
        [10, 20, 30, 40, null, undefined],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at key derived_20', async () => {
      return testInput(mp => mp.cacheClearByResult('s-2nd', (res, key) => key === 'derived_20'), [
        [],
        [20],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at result 20', async () => {
      return testInput(mp => mp.cacheClearByResult('s-2nd', (res, key) => res === 20), [
        [],
        [20],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at result 40', async () => {
      return testInput(mp => mp.cacheClearByResult('s-2nd', (res, key) => res === 40), [
        [],
        [40],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at result null', async () => {
      return testInput(mp => mp.cacheClearByResult('s-2nd', (res, key) => res === null), [
        [],
        [null],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('clears out the cache in the second valve at result undefined', async () => {
      return testInput(mp => mp.cacheClearByResult('s-2nd', (res, key) => res === undefined), [
        [],
        [undefined],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })
  })

  describe('UpdateByResult at 2', () => {
    it('updates the cache in the second valve', async () => {
      return testInput(mp => mp.cacheUpdateByResult('s-2nd', (res, key) => res), [
        [],
        [],
        [],
        [10, 20, 30, 40, null, undefined],
      ])
    })

    it('updates the cache in the second valve at key derived_20', async () => {
      return testInput(mp => mp.cacheUpdateByResult('s-2nd', (res, key) => key === 'derived_20' ? 200 : res), [
        [],
        [],
        [200],
        [10, 200, 30, 40, null, undefined],
      ])
    })

    it('updates the cache in the second valve at result 20', async () => {
      return testInput(mp => mp.cacheUpdateByResult('s-2nd', (res, key) => res === 20 ? 200 : res), [
        [],
        [],
        [200],
        [10, 200, 30, 40, null, undefined],
      ])
    })

    it('updates the cache in the second valve at result 40', async () => {
      return testInput(mp => mp.cacheUpdateByResult('s-2nd', (res, key) => res === 40 ? 400 : res), [
        [],
        [],
        [400],
        [10, 20, 30, 400, null, undefined],
      ])
    })

    it('updates the cache in the second valve at result null', async () => {
      return testInput(mp => mp.cacheUpdateByResult('s-2nd', (res, key) => res === null  ? 'hobo' : res), [
        [],
        [],
        ['hobo'],
        [10, 20, 30, 40, 'hobo', undefined],
      ])
    })

    it('updates the cache in the second valve at result undefined', async () => {
      return testInput(mp => mp.cacheUpdateByResult('s-2nd', (res, key) => res === undefined ? 'lobo': res), [
        [],
        [],
        ['lobo'],
        [10, 20, 30, 40, null, 'lobo'],
      ])
    })
  })

  describe('Populate at 2', () => {

    it('populates the cache in the second valve at 10', async () => {
      return testInput(mp => mp.cachePopulate('s-2nd', 10, 'zzz'), [
        [],
        [],
        ['zzz'],
        ['zzz', 20, 30, 40, null, undefined],
      ])
    })

    it('populates the cache in the second valve at 20', async () => {
      return testInput(mp => mp.cachePopulate('s-2nd', 20, 'lll'), [
        [],
        [],
        ['lll'],
        [10, 'lll', 30, 40, null, undefined],
      ])
    })

    it('populates the cache in the second valve at null', async () => {
      return testInput(mp => mp.cachePopulate('s-2nd', null, 'hobo'), [
        [],
        [],
        ['hobo'],
        [10, 20, 30, 40, 'hobo', undefined],
      ])
    })

    it('populates the cache in the second valve at undefined', async () => {
      return testInput(mp => mp.cachePopulate('s-2nd', undefined, 'lobo'), [
        [],
        [],
        ['lobo'],
        [10, 20, 30, 40, null, 'lobo'],
      ])
    })
  })
})

describe('MoonPipe.Cache with Splitter + nesting and dbl join', () => {

  async function testInput(method, expected) {
    let side_1 = []
    let side_2 = []
    let side_3 = []
    let side_4 = []
    let result = []
    const mp = new MoonPipe()
      .splitBy(1, () => 'wahtever', { name: 'split-1' })
      .splitBy(1, () => 'wahtever', { name: 'split-2' })
      .queueTap(async (value) => {
        side_1.push(value)
      }, { cache: true, name: 's2-1st' })
      .join()
      .queueTap(async (value) => {
        side_2.push(value)
      }, { cache: true, name: 's1-1st'  })
      .join()
      .splitBy(1, () => 'wahtever', { name: 'split-3' })
      .queueTap(async (value) => {
        side_3.push(value)
      }, { cache: true, name: 's3-1st'  })
      .join()
      .queueTap(async (value) => {
        side_4.push(value)
      }, { cache: true, name: 'b-1st'  })
      .queueTap(async (value) => {
        result.push(value)
      })

    mp.pump(10)
    mp.pump(20)
    mp.pump(30)
    mp.pump(40)

    await delayPromise(5)
    expect(side_1).to.eql([10, 20, 30, 40])
    expect(side_2).to.eql([10, 20, 30, 40])
    expect(side_3).to.eql([10, 20, 30, 40])
    expect(side_4).to.eql([10, 20, 30, 40])
    expect(result).to.eql([10, 20, 30, 40])

    // -------------------------------------------------------------------------

    method(mp)

    side_1 = []
    side_2 = []
    side_3 = []
    side_4 = []
    result = []

    mp.pump(10)
    mp.pump(20)
    mp.pump(30)
    mp.pump(40)

    await delayPromise(5)
    expect(side_1).to.eql(expected[0])
    expect(side_2).to.eql(expected[1])
    expect(side_3).to.eql(expected[2])
    expect(side_4).to.eql(expected[3])
    expect(result).to.eql(expected[4])
  }

  describe('ClearOne at 0 - first Splitter', () => {
    it('clears out the cache', () => {
      return testInput(mp => mp.cacheClearOne('split-1'), [
        [10, 20, 30, 40],
        [10, 20, 30, 40],
        [],
        [],
        [10, 20, 30, 40],
      ])
    })
  })

  describe('ClearOne at 1 - second Splitter', () => {
    it('clears out the cache', async () => {
      return testInput(mp => mp.cacheClearOne('split-2'), [
        [10, 20, 30, 40],
        [],
        [],
        [],
        [10, 20, 30, 40],
      ])
    })
  })

  describe('ClearOne at 2 - first valve in the second Splitter', () => {
    it('clears out the cache', async () => {
      return testInput(mp => mp.cacheClearOne('s2-1st'), [
        [10, 20, 30, 40],
        [],
        [],
        [],
        [10, 20, 30, 40],
      ])
    })
  })

  describe('ClearOne at 3 - first valve in the first Splitter', () => {
    it('clears out the cache', async () => {
      return testInput(mp => mp.cacheClearOne('s1-1st'), [
        [],
        [10, 20, 30, 40],
        [],
        [],
        [10, 20, 30, 40],
      ])
    })
  })

  describe('ClearOne at 4 - third Splitter', () => {
    it('clears out the cache', async () => {
      return testInput(mp => mp.cacheClearOne('split-3'), [
        [],
        [],
        [10, 20, 30, 40],
        [],
        [10, 20, 30, 40],
      ])
    })
  })

  describe('ClearOne at 5 - first valve in the third Splitter', () => {
    it('clears out the cache', async () => {
      return testInput(mp => mp.cacheClearOne('s3-1st'), [
        [],
        [],
        [10, 20, 30, 40],
        [],
        [10, 20, 30, 40],
      ])
    })
  })

  describe('ClearOne at 6 - first top level valve', () => {
    it('clears out the cache', async () => {
      return testInput(mp => mp.cacheClearOne('b-1st'), [
        [],
        [],
        [],
        [10, 20, 30, 40],
        [10, 20, 30, 40],
      ])
    })
  })

  describe('ClearAll', () => {
    it('clears out all valves', async () => {
      return testInput(mp => mp.cacheClearAll(), [
        [10, 20, 30, 40],
        [10, 20, 30, 40],
        [10, 20, 30, 40],
        [10, 20, 30, 40],
        [10, 20, 30, 40],
      ])
    })
  })
})
