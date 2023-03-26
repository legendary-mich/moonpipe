'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](10, { maxBufferSize: 0 })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      results.push('err_' + err.message)
    })
    .onBusyTap(async (value) => {
      results.push('on_busy_' + value)
    })
    .onIdle(async () => {
      results.push('on_idle')
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

  describe('MoonPipe.queueEager', () => {
    it('pumps values on a regular interval', () => {
      return testInput('queueEager', [
        ['on_busy_1', 'err_Buffer overflow', 'err_Buffer overflow', 'err_Buffer overflow', 'on_idle'],
        ['on_busy_1', 'err_Buffer overflow', 'err_Buffer overflow', 'err_Buffer overflow', 'on_idle'],
        ['on_busy_1', 'err_Buffer overflow', 'err_Buffer overflow', 'err_Buffer overflow', 'on_idle'],
        ['on_busy_1', 'err_Buffer overflow', 'err_Buffer overflow', 'err_Buffer overflow', 'on_idle'],
      ])
    })
  })

  describe('MoonPipe.queueLazy', () => {
    it('pumps values on a regular interval', () => {
      return testInput('queueLazy', [
        ['on_busy_1', 'err_Buffer overflow', 'err_Buffer overflow', 'err_Buffer overflow', 'on_idle'],
        ['on_busy_1', 'err_Buffer overflow', 'err_Buffer overflow', 'err_Buffer overflow', 'on_idle'],
        ['on_busy_1', 'err_Buffer overflow', 'err_Buffer overflow', 'err_Buffer overflow', 'on_idle'],
        ['on_busy_1', 'err_Buffer overflow', 'err_Buffer overflow', 'err_Buffer overflow', 'on_idle'],
      ])
    })
  })

  describe('MoonPipe.cancelEager', () => {
    it('pushes the first value through immediately', () => {
      return testInput('cancelEager', [
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
      ])
    })
  })

  describe('MoonPipe.cancelLazy', () => {
    it('ignores initial values, and pumps the last one', () => {
      return testInput('cancelLazy', [
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
      ])
    })
  })

  describe('MoonPipe.throttleEager', () => {
    it('ignores the 2nd value as it is replaced by the 3rd one', () => {
      return testInput('throttleEager', [
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
      ])
    })
  })

  describe('MoonPipe.throttleLazy', () => {
    it('ignores initial values, and pumps the last one', () => {
      return testInput('throttleLazy', [
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
      ])
    })
  })

  describe('MoonPipe.skipEager', () => {
    it('whatever', () => {
      return testInput('skipEager', [
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
      ])
    })
  })

  describe('MoonPipe.skipLazy', () => {
    it('whatever', () => {
      return testInput('skipLazy', [
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
        ['on_busy_1','on_idle', 'on_busy_2', 'on_idle', 'on_busy_3', 'on_idle'],
      ])
    })
  })
})
