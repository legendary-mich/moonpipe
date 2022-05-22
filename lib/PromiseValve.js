'use strict'

const { BaseValve, BUFFER_TYPE, OVERFLOW_ACTION } = require('./BaseValve.js')
const {
  RichPromise,
  PROMISE_RESOLVE_TYPE,
  TimeoutError,
} = require('./RichPromise.js')

class PromiseValve extends BaseValve {

  constructor(preset, promiseFactory) {
    super(preset)
    validatePreset(preset, promiseFactory)
    this.cancelOnPump = preset.cancelOnPump
    this.timeoutMs = preset.timeoutMs
    this.resolveType = preset.resolveType
    this.cache = {
      enabled: preset.cache,
      hashFunction: preset.hashFunction,
      results: new Map(),
    }
    this.repeatCounter = preset.repeatOnError

    this.promiseFactory = promiseFactory
    this.promisePool = []
    this.poolSize = preset.poolSize
  }

  cacheClearOne(value) {
    this.cache.results.delete(this.cache.hashFunction(value));
  }

  cacheClear() {
    this.cache.results.clear();
  }

  async next() {
    // Awaiting for an empty promise to give values pumped
    // synchronously a chance to accumulate.
    await Promise.resolve()

    if (this.buffer.length < 1) { return }
    if (this.cancelOnPump) {
      for (const c of this.promisePool) {
        c.cancel()
      }
      this.promisePool = []
    }
    if (this.promisePool.length >= this.poolSize) {
      return
    }

    const value = this.pluck()
    if (this.cache.results.has(this.cache.hashFunction(value))) {
      this.onData(this.cache.results.get(this.cache.hashFunction(value)))
      this.onReady()
    }
    else {
      this.numberOfReservedSlots++
      const newPromise = new RichPromise(
        this.promiseFactory,
        this.resolveType,
        this.timeoutMs
      )
      this.promisePool.push(newPromise)
      try {
        const result = await newPromise.run(value, this.repeatCounter)
        if (this.cache.enabled) {
          this.cache.results.set(this.cache.hashFunction(value), result)
        }
        this.onData(result)
      }
      catch (error) {
        this.onError(error)
      }
      finally {
        this.promisePool = this.promisePool.filter(c => c !== newPromise)
        this.numberOfReservedSlots--
        this.onReady()
      }
    }
  }

}

function validatePreset(preset, promiseFactory) {
  if (typeof preset.cancelOnPump !== 'boolean') {
    throw new Error(`Unexpected 'cancelOnPump': ${preset.cancelOnPump}`)
  }
  if (typeof preset.timeoutMs !== 'number' || preset.timeoutMs < 0) {
    throw new Error(`Expected timeoutMs to be a 'number' greater or equal to 0; found: ${preset.timeoutMs}`)
  }
  if (typeof preset.poolSize !== 'number' || preset.poolSize < 1) {
    throw new Error(`Expected poolSize to be a 'number' greater or equal to 1; found: ${preset.poolSize}`)
  }
  if (!Object.values(PROMISE_RESOLVE_TYPE).includes(preset.resolveType)) {
    throw new Error(`Unexpected 'resolveType': ${preset.resolveType}`)
  }
  if (typeof preset.cache !== 'boolean') {
    throw new Error(`Unexpected 'cache': ${preset.cache}`)
  }
  if (typeof preset.hashFunction !== 'function') {
    throw new Error(`Unexpected 'hashFunction': ${preset.hashFunction}`)
  }
  if (typeof preset.repeatOnError !== 'number' || preset.repeatOnError < 0) {
    throw new Error(`Expected repeatOnError to be a 'number' greater or equal to 0; found: ${preset.repeatOnError}`)
  }
  if (typeof promiseFactory !== 'function') {
    throw new Error(`Unexpected 'promiseFactory': ${promiseFactory}`)
  }
}

const queueMap = {
  maxBufferSize: Number.MAX_SAFE_INTEGER,
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
const cancelMap = {
  maxBufferSize: 1,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.SHIFT,
  resolveType: PROMISE_RESOLVE_TYPE.MAP,
  cancelOnPump: true,
  timeoutMs: 0,
  poolSize: 1,
  cache: false,
  hashFunction: value => value,
  repeatOnError: 0,
}
const throttleMap = {
  maxBufferSize: 1,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.SHIFT,
  resolveType: PROMISE_RESOLVE_TYPE.MAP,
  cancelOnPump: false,
  timeoutMs: 0,
  poolSize: 1,
  cache: false,
  hashFunction: value => value,
  repeatOnError: 0,
}
const skipMap = {
  maxBufferSize: 1,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.SKIP,
  resolveType: PROMISE_RESOLVE_TYPE.MAP,
  cancelOnPump: false,
  timeoutMs: 0,
  poolSize: 1,
  cache: false,
  hashFunction: value => value,
  repeatOnError: 0,
}
const sliceMap = {
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.SLICE,
  resolveType: PROMISE_RESOLVE_TYPE.MAP,
  cancelOnPump: false,
  timeoutMs: 0,
  poolSize: 1,
  cache: false,
  hashFunction: value => value,
  repeatOnError: 0,
}

function tapPreset(basePreset) {
  return Object.assign({}, basePreset, { resolveType: PROMISE_RESOLVE_TYPE.TAP})
}

module.exports = {
  PromiseValve,
  PROMISE_RESOLVE_TYPE,
  TimeoutError,
  PromisePresets: {
    queueMap,
    cancelMap,
    throttleMap,
    skipMap,
    sliceMap,
    queueTap: tapPreset(queueMap),
    cancelTap: tapPreset(cancelMap),
    throttleTap: tapPreset(throttleMap),
    skipTap: tapPreset(skipMap),
    sliceTap: tapPreset(sliceMap),
  },
}
