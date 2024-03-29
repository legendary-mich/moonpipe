'use strict'

const { expect } = require('chai')
const {
  MoonPipe,
  BUFFER_TYPE,
  OVERFLOW_ACTION,
  TimeValve,
  TIME_RESOLVE_TYPE,
  PromiseValve,
  PROMISE_RESOLVE_TYPE,
} = require('../index.js')
const { delayPromise } = require('./utils.js')

describe('Custom Valves,', () => {

  describe('Custom TimeValve', () => {
    it('does not throw', async () => {
      const preset = {
        name: null,
        maxBufferSize: 3,
        bufferType: BUFFER_TYPE.QUEUE,
        overflowAction: OVERFLOW_ACTION.SHIFT,
        resolveType: TIME_RESOLVE_TYPE.LAZY,
        cancelOnPump: false,
      }
      const customTimeValve = new TimeValve(preset, 10)
      const results = []
      const pipe = new MoonPipe()
        .pipe(customTimeValve)
        .queueTap(async (val) => {
          results.push(val)
        })

      pipe.pump(1)
      pipe.pump(2)
      pipe.pump(3)
      pipe.pump(4)
      pipe.pump(5)

      await delayPromise(60)
      expect(results).to.eql([3, 4, 5])
    })
  })

  describe('Custom PromiseValve', () => {
    it('does not throw', async () => {
      const preset = {
        name: null,
        maxBufferSize: 3,
        bufferType: BUFFER_TYPE.QUEUE,
        overflowAction: OVERFLOW_ACTION.SHIFT,
        resolveType: PROMISE_RESOLVE_TYPE.MAP,
        cancelOnPump: false,
        timeoutMs: 0,
        poolSize: 1,
        cache: false,
        hashFunction: value => value,
        repeatPredicate: () => false,
      }
      const customPromiseValve = new PromiseValve(preset, async (value) => value + 100)
      const results = []
      const pipe = new MoonPipe()
        .pipe(customPromiseValve)
        .queueTap(async (val) => {
          results.push(val)
        })

      pipe.pump(1)
      pipe.pump(2)
      pipe.pump(3)
      pipe.pump(4)
      pipe.pump(5)

      await delayPromise(60)
      expect(results).to.eql([101, 104, 105])
    })
  })
})
