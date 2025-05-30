'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](async (value) => {
    results.push('side_' + value)
    await delayPromise(5)
    throw new Error(value + 100)
  }, {
    repeatVerbose: true,
    repeatPredicate: (attemptsMade, err) => {
      return err && attemptsMade <= 2
    },
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      results.push('err_' + err.message)
      await delayPromise(2)
    })
    .onBusy(() => {
      results.push('on_busy')
    })
    .onIdle(() => {
      results.push('on_idle')
    })

  pipe.pump(1)
  await delayPromise(1)
  pipe.pump(2)
  await delayPromise(50)
  expect(results).to.eql(expected)
}

describe('PromiseValves.Repeat.Fail.Verbose', () => {

  describe('MoonPipe.queueTap', () => {
    it('emits an Error', () => {
      return testInput('queueTap', [
        'on_busy',
        'side_1',
        'err_101',
        'side_1',
        'err_101',
        'side_1',
        'err_101',
        'side_2',
        'err_102',
        'side_2',
        'err_102',
        'side_2',
        'err_102',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.queueMap', () => {
    it('emits an Error', () => {
      return testInput('queueMap', [
        'on_busy',
        'side_1',
        'err_101',
        'side_1',
        'err_101',
        'side_1',
        'err_101',
        'side_2',
        'err_102',
        'side_2',
        'err_102',
        'side_2',
        'err_102',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.cancelTap', () => {
    it('emits an Error', () => {
      return testInput('cancelTap', [
        'on_busy',
        'side_1',
        'side_2',
        'err_102',
        'side_2',
        'err_102',
        'side_2',
        'err_102',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.cancelMap', () => {
    it('emits an Error', () => {
      return testInput('cancelMap', [
        'on_busy',
        'side_1',
        'side_2',
        'err_102',
        'side_2',
        'err_102',
        'side_2',
        'err_102',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.throttleTap', () => {
    it('emits an Error', () => {
      return testInput('throttleTap', [
        'on_busy',
        'side_1',
        'err_101',
        'side_1',
        'err_101',
        'side_1',
        'err_101',
        'side_2',
        'err_102',
        'side_2',
        'err_102',
        'side_2',
        'err_102',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.throttleMap', () => {
    it('emits an Error', () => {
      return testInput('throttleMap', [
        'on_busy',
        'side_1',
        'err_101',
        'side_1',
        'err_101',
        'side_1',
        'err_101',
        'side_2',
        'err_102',
        'side_2',
        'err_102',
        'side_2',
        'err_102',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.skipTap', () => {
    it('whatever', () => {
      return testInput('skipTap', [
        'on_busy',
        'side_1',
        'err_101',
        'side_1',
        'err_101',
        'side_1',
        'err_101',
        'on_idle',
      ])
    })
  })

  describe('MoonPipe.skipMap', () => {
    it('whatever', () => {
      return testInput('skipMap', [
        'on_busy',
        'side_1',
        'err_101',
        'side_1',
        'err_101',
        'side_1',
        'err_101',
        'on_idle',
      ])
    })
  })
})
