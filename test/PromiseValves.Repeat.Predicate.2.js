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
    repeatPredicate: (attemptsMade, err) => {
      return attemptsMade <= 2 && err.message === '102'
    },
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })

  pipe.pump(1)
  await delayPromise(1)
  pipe.pump(2)
  await delayPromise(50)
  expect(results).to.eql(expected)
}

describe('PromiseValves.Repeat.Predicate.2.js', () => {

  describe('MoonPipe.queueTap', () => {
    it('emits an Error', () => {
      return testInput('queueTap', [
        'side_1',
        'err_101',
        'side_2',
        'side_2',
        'side_2',
        'err_102',
      ])
    })
  })

  describe('MoonPipe.queueMap', () => {
    it('emits an Error', () => {
      return testInput('queueMap', [
        'side_1',
        'err_101',
        'side_2',
        'side_2',
        'side_2',
        'err_102',
      ])
    })
  })

  describe('MoonPipe.cancelTap', () => {
    it('emits an Error', () => {
      return testInput('cancelTap', [
        'side_1',
        'side_2',
        'side_2',
        'side_2',
        'err_102',
      ])
    })
  })

  describe('MoonPipe.cancelMap', () => {
    it('emits an Error', () => {
      return testInput('cancelMap', [
        'side_1',
        'side_2',
        'side_2',
        'side_2',
        'err_102',
      ])
    })
  })

  describe('MoonPipe.throttleTap', () => {
    it('emits an Error', () => {
      return testInput('throttleTap', [
        'side_1',
        'err_101',
        'side_2',
        'side_2',
        'side_2',
        'err_102',
      ])
    })
  })

  describe('MoonPipe.throttleMap', () => {
    it('emits an Error', () => {
      return testInput('throttleMap', [
        'side_1',
        'err_101',
        'side_2',
        'side_2',
        'side_2',
        'err_102',
      ])
    })
  })

  describe('MoonPipe.skipTap', () => {
    it('whatever', () => {
      return testInput('skipTap', [
        'side_1',
        'err_101',
      ])
    })
  })

  describe('MoonPipe.skipMap', () => {
    it('whatever', () => {
      return testInput('skipMap', [
        'side_1',
        'err_101',
      ])
    })
  })
})
