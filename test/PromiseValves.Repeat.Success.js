'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  let counter = 0
  const pipe = new MoonPipe()[method](async (value) => {
    results.push('side_' + value)
    await delayPromise(3)
    if (counter++ < 2) {
      throw new Error(value + 100)
    }
    else {
      return value + 100
    }
  }, {
    repeatPredicate: (attemptsMade, err) => {
      return err && attemptsMade <= 2
    },
  })
    .queueTap(async (value) => {
      counter = 0
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })
    .onBusyTap(async (value) => {
      results.push('on_busy_' + value)
    })
    .onIdle(async (value) => {
      results.push('on_idle_' + value)
    })

  pipe.pump(1)
  await delayPromise(1)
  pipe.pump(2)
  await delayPromise(25)
  expect(results).to.eql(expected)
}

describe('PromiseValves Repeat on Error - Eventual Success,', () => {

  describe('MoonPipe.queueTap', () => {
    it('eventually succeeds', () => {
      return testInput('queueTap', [
        'on_busy_1',
        'side_1',
        'side_1',
        'side_1',
        'res_1',
        'side_2',
        'side_2',
        'side_2',
        'res_2',
        'on_idle_undefined',
      ])
    })
  })

  describe('MoonPipe.queueMap', () => {
    it('eventually succeeds', () => {
      return testInput('queueMap', [
        'on_busy_1',
        'side_1',
        'side_1',
        'side_1',
        'res_101',
        'side_2',
        'side_2',
        'side_2',
        'res_102',
        'on_idle_undefined',
      ])
    })
  })

  describe('MoonPipe.cancelTap', () => {
    it('eventually succeeds', () => {
      return testInput('cancelTap', [
        'on_busy_1',
        'side_1',
        'side_2',
        'side_2',
        'res_2',
        'on_idle_undefined',
      ])
    })
  })

  describe('MoonPipe.cancelMap', () => {
    it('eventually succeeds', () => {
      return testInput('cancelMap', [
        'on_busy_1',
        'side_1',
        'side_2',
        'side_2',
        'res_102',
        'on_idle_undefined',
      ])
    })
  })

  describe('MoonPipe.throttleTap', () => {
    it('eventually succeeds', () => {
      return testInput('throttleTap', [
        'on_busy_1',
        'side_1',
        'side_1',
        'side_1',
        'res_1',
        'side_2',
        'side_2',
        'side_2',
        'res_2',
        'on_idle_undefined',
      ])
    })
  })

  describe('MoonPipe.throttleMap', () => {
    it('eventually succeeds', () => {
      return testInput('throttleMap', [
        'on_busy_1',
        'side_1',
        'side_1',
        'side_1',
        'res_101',
        'side_2',
        'side_2',
        'side_2',
        'res_102',
        'on_idle_undefined',
      ])
    })
  })

  describe('MoonPipe.skipTap', () => {
    it('whatever', () => {
      return testInput('skipTap', [
        'on_busy_1',
        'side_1',
        'side_1',
        'side_1',
        'res_1',
        'on_idle_undefined',
      ])
    })
  })

  describe('MoonPipe.skipMap', () => {
    it('whatever', () => {
      return testInput('skipMap', [
        'on_busy_1',
        'side_1',
        'side_1',
        'side_1',
        'res_101',
        'on_idle_undefined',
      ])
    })
  })
})
