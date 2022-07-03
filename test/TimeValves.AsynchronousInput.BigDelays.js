'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](10)
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })

  pipe.pump(1)
  delayPromise(8).then(async () => {
    pipe.pump(2)
    await delayPromise(9)
    pipe.pump(3)
  })

  await delayPromise(5)
  expect(results).to.eql(expected[0])
  await delayPromise(10)
  expect(results).to.eql(expected[1])
  await delayPromise(10)
  expect(results).to.eql(expected[2])
  await delayPromise(10)
  expect(results).to.eql(expected[3])
}

describe('TimeValves with Asynchronous input and big delays.', () => {

  describe('MoonPipe.queueEager', () => {
    it('pumps values on a regular interval', () => {
      return testInput('queueEager', [
        ['res_1'],
        ['res_1', 'res_2'],
        ['res_1', 'res_2', 'res_3'],
        ['res_1', 'res_2', 'res_3'],
      ])
    })
  })

  describe('MoonPipe.queueLazy', () => {
    it('pumps values on a regular interval', () => {
      return testInput('queueLazy', [
        [],
        ['res_1'],
        ['res_1', 'res_2'],
        ['res_1', 'res_2', 'res_3'],
      ])
    })
  })

  describe('MoonPipe.cancelEager', () => {
    it('pushes all the values through immediately', () => {
      return testInput('cancelEager', [
        ['res_1'],
        ['res_1', 'res_2'],
        ['res_1', 'res_2', 'res_3'],
        ['res_1', 'res_2', 'res_3'],
      ])
    })
  })

  describe('MoonPipe.cancelLazy', () => {
    it('ignores initial values, and pumps the last one', () => {
      return testInput('cancelLazy', [
        [],
        [],
        [],
        ['res_3'],
      ])
    })
  })

  describe('MoonPipe.throttleEager', () => {
    it('ignores the 2nd value as it is replaced by the 3rd one', () => {
      return testInput('throttleEager', [
        ['res_1'],
        ['res_1', 'res_2'],
        ['res_1', 'res_2', 'res_3'],
        ['res_1', 'res_2', 'res_3'],
      ])
    })
  })

  describe('MoonPipe.throttleLazy', () => {
    it('ignores initial values, and pumps the last one', () => {
      return testInput('throttleLazy', [
        [],
        ['res_2'],
        ['res_2'],
        ['res_2', 'res_3'],
      ])
    })
  })

  describe('MoonPipe.skipEager', () => {
    it('whatever', () => {
      return testInput('skipEager', [
        ['res_1'],
        ['res_1', 'res_2'],
        ['res_1', 'res_2', 'res_3'],
        ['res_1', 'res_2', 'res_3'],
      ])
    })
  })

  describe('MoonPipe.skipLazy', () => {
    it('whatever', () => {
      return testInput('skipLazy', [
        [],
        ['res_1'],
        ['res_1'],
        ['res_1', 'res_3'],
      ])
    })
  })
})
