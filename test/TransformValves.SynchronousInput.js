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

  for (const val of input) {
    pipe.pump(val)
  }

  await delayPromise(5)
  expect(results).to.eql(expected)
}

describe('TimeValves with Synchronous input.', () => {

  describe('MoonPipe.flatten', () => {
    it('emits an onData event for every item in the array', async () => {
      return testInput('flatten', null, [
        [1, 2, 3],
        [10, 20, 30],
      ], [
        'res_1',
        'res_2',
        'res_3',
        'res_10',
        'res_20',
        'res_30',
      ])
    })

    it('emits an error event if the value pumped is not an array', async () => {
      return testInput('flatten', null, [
        1,
        [10, 20, 30],
      ], [
        'err_Expected an array; found: number',
        'res_10',
        'res_20',
        'res_30',
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
        'res_2',
        'res_4',
        'res_6',
      ])
    })

    it('emits an onError event when the function throws', async () => {
      return testInput('map', () => { throw new Error('wrong') }, [
        1,
        2,
        3,
      ], [
        'err_wrong',
        'err_wrong',
        'err_wrong',
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
        'res_1',
        'res_3',
      ])
    })

    it('emits an onError event when the function throws', async () => {
      return testInput('filter', () => { throw new Error('zonk') }, [
        1,
        2,
        3,
      ], [
        'err_zonk',
        'err_zonk',
        'err_zonk',
      ])
    })
  })
})
