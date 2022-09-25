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
  pipe.pump(2)

  await delayPromise(5)
  expect(results).to.eql(expected[0])
  pipe.buffersClearAll()
  await delayPromise(10)
  expect(results).to.eql(expected[1])
  pipe.pump(3)

  await delayPromise(10)
  expect(results).to.eql(expected[2])
  await delayPromise(10)
  expect(results).to.eql(expected[3])
}

describe('TimeValves.Buffers.Clear.All.js', () => {

  describe('MoonPipe.queueEager', () => {
    it('pumps values on a regular interval', () => {
      return testInput('queueEager', [
        ['res_1'],
        ['res_1'],
        ['res_1', 'res_3'],
        ['res_1', 'res_3'],
      ])
    })
  })

  describe('MoonPipe.queueLazy', () => {
    it('pumps values on a regular interval', () => {
      return testInput('queueLazy', [
        [],
        [],
        ['res_3'],
        ['res_3'],
      ])
    })
  })

  describe('MoonPipe.cancelEager', () => {
    it('pushes the first value through immediately', () => {
      return testInput('cancelEager', [
        ['res_1'],
        ['res_1'],
        ['res_1', 'res_3'],
        ['res_1', 'res_3'],
      ])
    })
  })

  describe('MoonPipe.cancelLazy', () => {
    it('ignores initial values, and pumps the last one', () => {
      return testInput('cancelLazy', [
        [],
        [],
        ['res_3'],
        ['res_3'],
      ])
    })
  })

  describe('MoonPipe.throttleEager', () => {
    it('ignores the 2nd value as it is replaced by the 3rd one', () => {
      return testInput('throttleEager', [
        ['res_1'],
        ['res_1'],
        ['res_1', 'res_3'],
        ['res_1', 'res_3'],
      ])
    })
  })

  describe('MoonPipe.throttleLazy', () => {
    it('ignores initial values, and pumps the last one', () => {
      return testInput('throttleLazy', [
        [],
        [],
        ['res_3'],
        ['res_3'],
      ])
    })
  })

  describe('MoonPipe.skipEager', () => {
    it('whatever', () => {
      return testInput('skipEager', [
        ['res_1'],
        ['res_1'],
        ['res_1'],
        ['res_1'],
      ])
    })
  })

  describe('MoonPipe.skipLazy', () => {
    it('whatever', () => {
      return testInput('skipLazy', [
        [],
        [],
        ['res_3'],
        ['res_3'],
      ])
    })
  })
})
