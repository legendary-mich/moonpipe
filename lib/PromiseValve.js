'use strict'

const { BaseValve, BUFFER_TYPE, OVERFLOW_ACTION } = require('./BaseValve.js')
const PROMISE_RESOLVE_TYPE = {
  TAP: 'TAP',
  MAP: 'MAP',
}

class TimeoutError extends Error {
  constructor() {
    super('TimeoutError')
  }
}

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
    this.initialRepeatCounter = this.repeatCounter = preset.repeatOnError

    this.promiseFactory = promiseFactory
  }

  get activePromise() {
    return this._activePromise
  }
  set activePromise(newPromise) {
    this._activePromise = newPromise
    clearTimeout(this._activeTimeout)
  }

  handleError(error, value) {
    this.activePromise = null
    if (this.repeatCounter > 0) {
      --this.repeatCounter
      this.unpluck(value)
    }
    else {
      this.repeatCounter = this.initialRepeatCounter
      this.onError(error)
    }
    this.onReady()
  }

  cacheClearOne(value) {
    this.cache.results.delete(this.cache.hashFunction(value));
  }

  cacheClear() {
    this.cache.results.clear();
  }

  async buildPromise(value) {
    if (!this.cache.enabled ||
        !this.cache.results.has(this.cache.hashFunction(value))) {
      return this.promiseFactory(value)
    }
    else {
      return this.cache.results.get(this.cache.hashFunction(value))
    }
  }

  async next() {
    if (this.buffer.length < 1) { return }
    if (this.activePromise && !this.cancelOnPump) { return }

    const value = this.pluck()
    const promise = this.activePromise = this.buildPromise(value)
    if (this.timeoutMs) {
      this._activeTimeout = setTimeout(() => {
        this.activePromise = null
        this.handleError(new TimeoutError(), value)
      }, this.timeoutMs)
    }
    try {
      const promiseOutcome = await promise
      let result
      if (this.resolveType === PROMISE_RESOLVE_TYPE.MAP) {
        result = promiseOutcome
      }
      else if (this.resolveType === PROMISE_RESOLVE_TYPE.TAP) {
        result = value
      }
      else {
        throw new Error(`Unknown resolveType: ${this.resolveType}`)
      }
      if (promise === this.activePromise) {
        this.activePromise = null
        this.repeatCounter = this.initialRepeatCounter
        if (this.cache.enabled) {
          this.cache.results.set(this.cache.hashFunction(value), result)
        }
        this.onData(result)
        this.onReady()
      }
    }
    catch (error) {
      if (promise === this.activePromise) {
        this.handleError(error, value)
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
    queueTap: tapPreset(queueMap),
    cancelTap: tapPreset(cancelMap),
    throttleTap: tapPreset(throttleMap),
    skipTap: tapPreset(skipMap),
  },
}
