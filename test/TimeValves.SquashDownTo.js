'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](10, {
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
    .onIdle(() => {
      results.push('on_idle')
    })
    .onBusy(() => {
      results.push('on_busy')
    })


  pipe.pump({i: 0, op: 'post'})
  pipe.pump({i: 1, op: 'put'})
  pipe.pump({i: 2, op: 'put'})
  pipe.pump({i: 3, op: 'del'})
  pipe.pump({i: 4, op: 'post'})
  pipe.pump({i: 5, op: 'put'})
  pipe.pump({i: 6, op: 'put'})
  pipe.pump({i: 7, op: 'del'})

  await delayPromise(5)
  expect(results).to.eql(expected[0])
  await delayPromise(10)
  expect(results).to.eql(expected[1])
  await delayPromise(10)
  expect(results).to.eql(expected[2])
  await delayPromise(10)
  expect(results).to.eql(expected[3])
}

describe('TimeValves.SquashDownTo with Synchronous input.', () => {

  describe('MoonPipe.queueEager', () => {
    it('pumps values on a regular interval', () => {
      return testInput('queueEager', [
        ['on_busy', 'res_0_post'],
        ['on_busy', 'res_0_post', 'res_6_put'],
        ['on_busy', 'res_0_post', 'res_6_put', 'res_7_del'],
        ['on_busy', 'res_0_post', 'res_6_put', 'res_7_del', 'on_idle'],
      ])
    })
  })

  describe('MoonPipe.queueLazy', () => {
    it('pumps values on a regular interval', () => {
      return testInput('queueLazy', [
        ['on_busy'],
        ['on_busy', 'res_4_post'],
        ['on_busy', 'res_4_post', 'res_6_put'],
        ['on_busy', 'res_4_post', 'res_6_put', 'res_7_del', 'on_idle'],
      ])
    })
  })
})
