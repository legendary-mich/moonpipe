'use strict'

const { expect } = require('chai')
const { MudPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MudPipe()[method](10, { maxBufferSize: 0 })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      results.push('err_' + err.message)
    })

  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(3)

  await delayPromise(5)
  expect(results).to.eql(expected[0])
  await delayPromise(10)
  expect(results).to.eql(expected[1])
  await delayPromise(10)
  expect(results).to.eql(expected[2])
  await delayPromise(10)
  expect(results).to.eql(expected[3])
}

describe('TimeValves.0.Width.Buffer.js', () => {

  describe('MudPipe.queueEager', () => {
    it('pumps values on a regular interval', () => {
      return testInput('queueEager', [
        ['err_Buffer overflow', 'err_Buffer overflow', 'err_Buffer overflow'],
        ['err_Buffer overflow', 'err_Buffer overflow', 'err_Buffer overflow'],
        ['err_Buffer overflow', 'err_Buffer overflow', 'err_Buffer overflow'],
        ['err_Buffer overflow', 'err_Buffer overflow', 'err_Buffer overflow'],
      ])
    })
  })

  describe('MudPipe.queueLazy', () => {
    it('pumps values on a regular interval', () => {
      return testInput('queueLazy', [
        ['err_Buffer overflow', 'err_Buffer overflow', 'err_Buffer overflow'],
        ['err_Buffer overflow', 'err_Buffer overflow', 'err_Buffer overflow'],
        ['err_Buffer overflow', 'err_Buffer overflow', 'err_Buffer overflow'],
        ['err_Buffer overflow', 'err_Buffer overflow', 'err_Buffer overflow'],
      ])
    })
  })

  describe('MudPipe.cancelEager', () => {
    it('pushes all the values through immediately', () => {
      return testInput('cancelEager', [
        ['res_1', 'res_2', 'res_3'],
        ['res_1', 'res_2', 'res_3'],
        ['res_1', 'res_2', 'res_3'],
        ['res_1', 'res_2', 'res_3'],
      ])
    })
  })

  describe('MudPipe.cancelLazy', () => {
    it('ignores initial values, and pumps the last one', () => {
      return testInput('cancelLazy', [
        [],
        ['res_3'],
        ['res_3'],
        ['res_3'],
      ])
    })
  })

  describe('MudPipe.throttleEager', () => {
    it('ignores the 2nd value as it is replaced by the 3rd one', () => {
      return testInput('throttleEager', [
        ['res_1'],
        ['res_1', 'res_3'],
        ['res_1', 'res_3'],
        ['res_1', 'res_3'],
      ])
    })
  })

  describe('MudPipe.throttleLazy', () => {
    it('ignores initial values, and pumps the last one', () => {
      return testInput('throttleLazy', [
        [],
        ['res_3'],
        ['res_3'],
        ['res_3'],
      ])
    })
  })

  describe('MudPipe.skipEager', () => {
    it('whatever', () => {
      return testInput('skipEager', [
        [],
        [],
        [],
        [],
      ])
    })
  })

  describe('MudPipe.skipLazy', () => {
    it('whatever', () => {
      return testInput('skipLazy', [
        [],
        [],
        [],
        [],
      ])
    })
  })
})
