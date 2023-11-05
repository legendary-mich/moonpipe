'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, param, input, expected) {
  const results = []
  const pipe = new MoonPipe()[method](param)
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      results.push('err_' + err.message)
    })
    .onBusyTap(async (value) => {
      results.push('on_busy_' + value)
    })
    .onIdle(async (value) => {
      results.push('on_idle_' + value)
    })

  for (const val of input) {
    pipe.pump(val)
  }

  await delayPromise(5)
  expect(results).to.eql(expected)
}

describe('TransformValves with Synchronous input.', () => {

  describe('MoonPipe.flatten', () => {
    it('emits an onData event for every item in the array', async () => {
      return testInput('flatten', null, [
        [1, 2, 3],
        [10, 20, 30],
      ], [
        'on_busy_1,2,3',
        'res_1',
        'res_2',
        'res_3',
        'res_10',
        'res_20',
        'res_30',
        'on_idle_undefined',
      ])
    })

    it('emits an error event if the value pumped is not an array', async () => {
      return testInput('flatten', null, [
        1,
        [10, 20, 30],
      ], [
        'on_busy_1',
        'err_Expected an array; found: number',
        'res_10',
        'res_20',
        'res_30',
        'on_idle_undefined',
      ])
    })
  })

  describe('MoonPipe.map', () => {
    it('emits an onData event for every item in the array', async () => {
      return testInput('map', val => val * 2, [
        1,
        2,
        3,
      ], [
        'on_busy_1',
        'res_2',
        'res_4',
        'res_6',
        'on_idle_undefined',
      ])
    })

    it('emits an onError event when the function throws', async () => {
      return testInput('map', () => { throw new Error('wrong') }, [
        1,
        2,
        3,
      ], [
        'on_busy_1',
        'err_wrong',
        'err_wrong',
        'err_wrong',
        'on_idle_undefined',
      ])
    })
  })

  describe('MoonPipe.filter', () => {
    it('emits an onData event for every item in the array', async () => {
      return testInput('filter', val => val % 2, [
        1,
        2,
        3,
      ], [
        'on_busy_1',
        'res_1',
        'res_3',
        'on_idle_undefined',
      ])
    })

    it('emits an onError event when the function throws', async () => {
      return testInput('filter', () => { throw new Error('zonk') }, [
        1,
        2,
        3,
      ], [
        'on_busy_1',
        'err_zonk',
        'err_zonk',
        'err_zonk',
        'on_idle_undefined',
      ])
    })
  })

  describe('MoonPipe.filterError', () => {
    it('is not activated since the input values go through the DATA channel', async () => {
      return testInput('filterError', val => val % 2, [
        1,
        2,
        3,
      ], [
        'on_busy_1',
        'res_1',
        'res_2',
        'res_3',
        'on_idle_undefined',
      ])
    })

    it('is not activated since the input values go through the DATA channel', async () => {
      return testInput('filterError', () => { throw new Error('zonk') }, [
        1,
        2,
        3,
      ], [
        'on_busy_1',
        'res_1',
        'res_2',
        'res_3',
        'on_idle_undefined',
      ])
    })
  })

  describe('NO ASYNC valves in the pipe', () => {
    it('emits a SINGLE on_idle event', async () => {
      const results = []
      const pipe = new MoonPipe()
        .map((value) => {
          results.push('res_' + value)
        })
        .onIdle(async (value) => {
          results.push('on_idle_' + value)
        })

      pipe.pump(1)

      await delayPromise(5)
      const expected = [
        'res_1',
        'on_idle_undefined',
      ]
      expect(results).to.eql(expected)
    })

  })

  describe('MoonPipe.filterError', () => {

    async function testErrorInput(predicate, expected) {
      const results = []
      const pipe = new MoonPipe()
        .onBusyTap(async (value) => {
          results.push('on_busy_' + value)
        })
        .queueTap(async (value) => {
          throw new Error('bobo-' + value)
        })
        .filterError(predicate)
        .queueTap(async (val) => {
          results.push('intercept_' + val)
        })
        .queueError(async (err) => {
          results.push('err_' + err.message)
        })
        .onIdle(async () => {
          results.push('on_idle')
        })

      pipe.pump(1)
      pipe.pump(2)
      pipe.pump(3)

      await delayPromise(5)
      expect(results).to.eql(expected)
    }

    it('emits filtered errors to the ERROR channel', async () => {
      return testErrorInput(err => err.message !== 'bobo-2', [
        'on_busy_1',
        'err_bobo-1',
        'err_bobo-3',
        'on_idle',
      ])
    })

    it('emits errors thrown wile filtering', async () => {
      err => {throw new Error(err.message + '_new')}
      return testErrorInput(err => {throw new Error(err.message + '_new')}, [
        'on_busy_1',
        'err_bobo-1_new',
        'err_bobo-2_new',
        'err_bobo-3_new',
        'on_idle',
      ])
    })
  })

})
