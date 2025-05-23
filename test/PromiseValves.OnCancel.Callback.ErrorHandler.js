'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](async (value, promiseContext) => {
    promiseContext.onCancel = () => {
      results.push('cancel_' + value)
      throw new Error(`unexpected_${value}`)
    }
    results.push('side_' + value)
    await delayPromise(1)
    return value + 100
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      results.push('err_' + err.message)
    })

  pipe.pump(1)
  await Promise.resolve()
  pipe.pump(2)
  await Promise.resolve()
  pipe.pump(3)
  await delayPromise(16)
  expect(results).to.eql(expected)
}

describe('PromiseValves.OnCancel.Callback.ErrorHandler', () => {

  describe('MoonPipe.cancelTap', () => {
    it('pumps the error to the nearest error valve', () => {
      return testInput('cancelTap', [
        'side_1',
        'cancel_1',
        'err_unexpected_1',
        'side_2',
        'cancel_2',
        'err_unexpected_2',
        'side_3',
        'res_3',
      ])
    })
  })

  describe('MoonPipe.cancelMap', () => {
    it('pumps the error to the nearest error valve', () => {
      return testInput('cancelMap', [
        'side_1',
        'cancel_1',
        'err_unexpected_1',
        'side_2',
        'cancel_2',
        'err_unexpected_2',
        'side_3',
        'res_103',
      ])
    })
  })

  describe('timeoutMs', () => {
    it('pumps the error to the nearest error valve', async () => {
      const results = []
      const pipe = new MoonPipe().queueMap(async (value, promiseContext) => {
        promiseContext.onCancel = () => {
          results.push('cancel_' + value)
          throw new Error(`unexpected_${value}`)
        }
        results.push('side_' + value)
        await delayPromise(3)
        return value + 100
      }, {
        timeoutMs: 1,
      })
        .queueTap(async (value) => {
          results.push('res_' + value)
        })
        .queueError(async (err) => {
          results.push('err_' + err.message)
        })

      pipe.pump(1)
      await Promise.resolve()
      pipe.pump(2)
      await delayPromise(16)
      expect(results).to.eql([
        'side_1',
        'cancel_1',
        'err_unexpected_1',
        'side_2',
        'cancel_2',
        'err_unexpected_2',
      ])
    })
  })
})
