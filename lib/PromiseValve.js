'use strict'

const {
  BaseValve,
  BUFFER_TYPE,
  OVERFLOW_ACTION,
  MAX_ARRAY_SIZE,
} = require('./BaseValve.js')
const {
  RichPromise,
  PROMISE_RESOLVE_TYPE,
  TimeoutError,
} = require('./RichPromise.js')
const { ConstantBackoff } = require('./Backoff.js')

class PromiseValve extends BaseValve {

  constructor(preset, promiseFactory) {
    super(preset)
    validatePreset(preset, promiseFactory)
    this.cancelOnPump = preset.cancelOnPump
    this.timeoutMs = preset.timeoutMs
    this.resolveType = preset.resolveType
    // When a PromiseValve is used within a Splitter, the cache will
    // be shared between sibling PromiseValves, meaning that the
    // 'cache' reference will point to the same instance in all the
    // siblings. Look at the Splitter class for more details.
    this.cache = {
      enabled: preset.cache,
      hashFunction: preset.hashFunction,
      results: new Map(),
    }

    this.promiseFactory = promiseFactory
    this.promisePool = []
    this.poolSize = preset.poolSize
  }

  clone() {
    return new PromiseValve(this.preset, this.promiseFactory)
  }

  bufferClear() {
    super.bufferClear()
    this.poolClear()
  }

  cacheClearAt(...values) {
    for (const value of values) {
      this.cache.results.delete(this.cache.hashFunction(value));
    }
  }

  cacheClear() {
    this.cache.results.clear();
  }

  poolAdd(promise) {
    this.numberOfReservedSlots++
    this.promisePool.push(promise)
  }

  poolRemove(promise) {
    this.numberOfReservedSlots--
    this.promisePool = this.promisePool.filter(c => c !== promise)
  }

  poolClear() {
    this.promisePool.forEach(promise => promise.cancel())
    this.numberOfReservedSlots = 0
    this.promisePool = []
  }

  async next() {
    // I don't want to accumulate values pumped synchronously
    // anymore. This serves a very narrow use case and makes the api
    // inconsistent. I want the same behaviour for pumping
    // synchronously, as I have for pumping asychnronously with a 0ms
    // delay. And I also want to be consistent with Eager TimeValves
    // which always let the first value pass through. The main
    // beneficiaries, which are slice valves and cancel valves, will
    // manage without it.
    // await Promise.resolve()

    if (this.buffer.length < 1) { return }
    if (this.cancelOnPump && this.promisePool.length > 0) {
      this.promisePool[0].cancel()
      this.poolRemove(this.promisePool[0])
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
      let newPromise
      try {
        newPromise = new RichPromise(this.preset, this.promiseFactory)
        this.poolAdd(newPromise)
        const result = await newPromise.run(value)
        if (this.cache.enabled) {
          this.cache.results.set(this.cache.hashFunction(value), result)
        }
        this.onData(result)
      }
      catch (error) {
        this.onError(error)
      }
      finally {
        if (newPromise) {
          this.poolRemove(newPromise)
        }
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
  if (typeof preset.repeatPredicate !== 'function') {
    throw new Error(`Unexpected 'repeatPredicate': ${preset.repeatPredicate}`)
  }
  if (preset.repeatBackoffFactory &&
      typeof preset.repeatBackoffFactory !== 'function') {
    throw new Error(`Unexpected 'repeatBackoffFactory': ${preset.repeatBackoffFactory}`)
  }
  if (typeof promiseFactory !== 'function') {
    throw new Error(`Unexpected 'promiseFactory': ${promiseFactory}`)
  }
}

const queueMap = {
  name: null,
  maxBufferSize: MAX_ARRAY_SIZE,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
  resolveType: PROMISE_RESOLVE_TYPE.MAP,
  cancelOnPump: false,
  timeoutMs: 0,
  poolSize: 1,
  cache: false,
  hashFunction: value => value,
  repeatPredicate: () => false,
  repeatBackoffFactory: () => new ConstantBackoff(0),
}
const cancelMap = {
  name: null,
  maxBufferSize: 1,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.SHIFT,
  resolveType: PROMISE_RESOLVE_TYPE.MAP,
  cancelOnPump: true,
  timeoutMs: 0,
  poolSize: 1,
  cache: false,
  hashFunction: value => value,
  repeatPredicate: () => false,
  repeatBackoffFactory: () => new ConstantBackoff(0),
}
const throttleMap = {
  name: null,
  maxBufferSize: 1,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.SHIFT,
  resolveType: PROMISE_RESOLVE_TYPE.MAP,
  cancelOnPump: false,
  timeoutMs: 0,
  poolSize: 1,
  cache: false,
  hashFunction: value => value,
  repeatPredicate: () => false,
  repeatBackoffFactory: () => new ConstantBackoff(0),
}
const skipMap = {
  name: null,
  maxBufferSize: 1,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.SKIP,
  resolveType: PROMISE_RESOLVE_TYPE.MAP,
  cancelOnPump: false,
  timeoutMs: 0,
  poolSize: 1,
  cache: false,
  hashFunction: value => value,
  repeatPredicate: () => false,
  repeatBackoffFactory: () => new ConstantBackoff(0),
}
const sliceMap = {
  name: null,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.SLICE,
  resolveType: PROMISE_RESOLVE_TYPE.MAP,
  cancelOnPump: false,
  timeoutMs: 0,
  poolSize: 1,
  cache: false,
  hashFunction: value => value,
  repeatPredicate: () => false,
  repeatBackoffFactory: () => new ConstantBackoff(0),
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
