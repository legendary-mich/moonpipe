'use strict'

const { expect } = require('chai')
const {
  MudPipe,
  BUFFER_TYPE,
  OVERFLOW_ACTION,
  PROMISE_RESOLVE_TYPE,
  TIME_RESOLVE_TYPE,
  PromiseValve,
  TimeValve,
  FlattenValve,
  MapValve,
  FilterValve,
  BufferOverflowError,
} = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(valve, expected) {
  const results = []
  const pipe = new MudPipe().pipe(valve)
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      await delayPromise(2)
      results.push('err_' + err.message)
    })

  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(3)
  pipe.pump(4)

  await delayPromise(16)
  expect(results).to.eql(expected)
}

describe('Buffer Overflow', () => {

  describe('with a PromiseValve and a bufferSize of 1', () => {
    it('pumps ORIGINAL values', () => {
      const preset = {
        maxBufferSize: 1,
        bufferType: BUFFER_TYPE.QUEUE,
        overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
        resolveType: PROMISE_RESOLVE_TYPE.MAP,
        cancelOnPump: false,
        timeoutMs: 0,
        poolSize: 1,
        cache: false,
        hashFunction: value => value,
        repeatOnError: 0,
      }
      const valve = new PromiseValve(preset, value => value + 100)
      return testInput(valve, [
        "err_Buffer overflow",
        "err_Buffer overflow",
        "err_Buffer overflow",
        "res_101",
      ])
    })
  })

  describe('with a PromiseValve and a bufferSize of 2', () => {
    it('pumps ORIGINAL values', () => {
      const preset = {
        maxBufferSize: 2,
        bufferType: BUFFER_TYPE.QUEUE,
        overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
        resolveType: PROMISE_RESOLVE_TYPE.MAP,
        cancelOnPump: false,
        timeoutMs: 0,
        poolSize: 1,
        cache: false,
        hashFunction: value => value,
        repeatOnError: 0,
      }
      const valve = new PromiseValve(preset, value => value + 100)
      return testInput(valve, [
        "err_Buffer overflow",
        "err_Buffer overflow",
        "res_101",
        "res_102",
      ])
    })
  })

  describe('with a TimeValve and TIME_RESOLVE_TYPE.LAZY', () => {
    it('pumps ORIGINAL values', () => {
      const preset = {
        maxBufferSize: 1,
        bufferType: BUFFER_TYPE.QUEUE,
        overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
        resolveType: TIME_RESOLVE_TYPE.LAZY,
        cancelOnPump: false,
      }
      const valve = new TimeValve(preset, 1)
      return testInput(valve, [
        "err_Buffer overflow",
        "err_Buffer overflow",
        "err_Buffer overflow",
        "res_1",
      ])
    })
  })

  describe('with a TimeValve and TIME_RESOLVE_TYPE.EAGER', () => {
    it('pumps ORIGINAL values', () => {
      const preset = {
        maxBufferSize: 1,
        bufferType: BUFFER_TYPE.QUEUE,
        overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
        resolveType: TIME_RESOLVE_TYPE.EAGER,
        cancelOnPump: false,
      }
      const valve = new TimeValve(preset, 1)
      return testInput(valve, [
        "res_1",
        "err_Buffer overflow",
        "err_Buffer overflow",
        "res_2",
      ])
    })
  })

  describe('with a FlattenValve', () => {
    it('pumps ORIGINAL values', async () => {
      const preset = {
        maxBufferSize: 1,
        bufferType: BUFFER_TYPE.QUEUE,
        overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
      }
      const valve = new FlattenValve(preset)
      const results = []
      const pipe = new MudPipe().pipe(valve)
        .queueTap(async (value) => {
          results.push('res_' + value)
        })
        .queueError(async (err) => {
          await delayPromise(2)
          results.push('err_' + err.message)
        })
      pipe.pump([1, 2])
      pipe.pump([10, 20])

      await delayPromise(16)
      // There are no errors here, because the valve flushes the
      // values synchronously, so they have no time to accumulate.
      // TODO: Add a test for the pipe in an error state.
      expect(results).to.eql([
        "res_1",
        "res_2",
        "res_10",
        "res_20",
      ])
    })
  })

  describe('with a MapValve', () => {
    it('pumps ORIGINAL values', () => {
      const preset = {
        maxBufferSize: 1,
        bufferType: BUFFER_TYPE.QUEUE,
        overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
      }
      const valve = new MapValve(preset, val => val)
      // There are no errors here, because the valve flushes the
      // values synchronously, so they have no time to accumulate.
      // TODO: Add a test for the pipe in an error state.
      return testInput(valve, [
        "res_1",
        "res_2",
        "res_3",
        "res_4",
      ])
    })
  })

  describe('with a FilterValve', () => {
    it('pumps ORIGINAL values', () => {
      const preset = {
        maxBufferSize: 1,
        bufferType: BUFFER_TYPE.QUEUE,
        overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
      }
      const valve = new FilterValve(preset, () => true)
      // There are no errors here, because the valve flushes the
      // values synchronously, so they have no time to accumulate.
      // TODO: Add a test for the pipe in an error state.
      return testInput(valve, [
        "res_1",
        "res_2",
        "res_3",
        "res_4",
      ])
    })
  })
})
