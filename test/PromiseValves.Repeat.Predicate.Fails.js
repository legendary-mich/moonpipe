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
    repeatPredicate: () => { throw new Error('pred failure') },
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

describe('PromiseValves.Repeat.Predicate.Fails.js', () => {

  describe('MoonPipe.queueTap', () => {
    it('emits an Error', () => {
      return testInput('queueTap', [
        'side_1',
        'err_pred failure',
        'side_2',
        'err_pred failure',
      ])
    })
  })

  describe('MoonPipe.queueMap', () => {
    it('emits an Error', () => {
      return testInput('queueMap', [
        'side_1',
        'err_pred failure',
        'side_2',
        'err_pred failure',
      ])
    })
  })

  describe('MoonPipe.cancelTap', () => {
    it('emits an Error', () => {
      return testInput('cancelTap', [
        'side_1',
        'side_2',
        'err_pred failure',
      ])
    })
  })

  describe('MoonPipe.cancelMap', () => {
    it('emits an Error', () => {
      return testInput('cancelMap', [
        'side_1',
        'side_2',
        'err_pred failure',
      ])
    })
  })

  describe('MoonPipe.throttleTap', () => {
    it('emits an Error', () => {
      return testInput('throttleTap', [
        'side_1',
        'err_pred failure',
        'side_2',
        'err_pred failure',
      ])
    })
  })

  describe('MoonPipe.throttleMap', () => {
    it('emits an Error', () => {
      return testInput('throttleMap', [
        'side_1',
        'err_pred failure',
        'side_2',
        'err_pred failure',
      ])
    })
  })

  describe('MoonPipe.skipTap', () => {
    it('whatever', () => {
      return testInput('skipTap', [
        'side_1',
        'err_pred failure',
      ])
    })
  })

  describe('MoonPipe.skipMap', () => {
    it('whatever', () => {
      return testInput('skipMap', [
        'side_1',
        'err_pred failure',
      ])
    })
  })
})
