'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](async (value) => {
    const string = `${value.i}_${value.op}`
    results.push('side_' + string)
    await delayPromise(1)
    return {...value, i: value.i + 10}
  }, {
    squashDownTo: (value) => value.op,
  })
    .queueTap(async (value) => {
      const string = `${value.i}_${value.op}`
      results.push('res_' + string)
    })
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })
    .onBusy(() => {
      results.push('on_busy')
    })
    .onIdle(() => {
      results.push('on_idle')
    })

  pipe.pump({i: 0, op: 'post'})
  pipe.pump({i: 1, op: 'put'})
  pipe.pump({i: 2, op: 'put'})
  pipe.pump({i: 3, op: 'del'})
  pipe.pump({i: 4, op: 'post'})
  pipe.pump({i: 5, op: 'put'})
  pipe.pump({i: 6, op: 'put'})
  pipe.pump({i: 7, op: 'del'})

  await delayPromise(16)
  expect(results).to.eql(expected)
}

describe('PromiseValves.SquashDownTo with Synchronous input.', () => {

  describe('MoonPipe.queueMap', () => {
    it('pumps ORIGINAL values', () => {
      return testInput('queueMap', [
        'on_busy',
        "side_0_post",
        "res_10_post",
        "side_6_put",
        "res_16_put",
        "side_7_del",
        "res_17_del",
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.queueTap', () => {
    it('pumps ORIGINAL values', () => {
      return testInput('queueTap', [
        'on_busy',
        "side_0_post",
        "res_0_post",
        "side_6_put",
        "res_6_put",
        "side_7_del",
        "res_7_del",
        'on_idle',
      ])
    })
  })
})
