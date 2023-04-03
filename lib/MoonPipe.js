'use strict'

const { BaseValve, BasePresets } = require('./BaseValve.js')

const {
  PromiseValve,
  PromisePresets,
} = require('./PromiseValve.js')

const {
  TimeValve,
  TimePresets,
} = require('./TimeValve.js')

const {
  FlattenValve,
  MapValve,
  FilterValve,
} = require('./SynchronousValves.js')

let Splitter

const { Latch } = require('./Latch.js')

const CHANNEL_TYPE = {
  DATA: 'DATA',
  ERROR: 'ERROR',
}

class MoonPipe {

  constructor() {
    this.channelValves = []
    this.activeChannel = CHANNEL_TYPE.DATA
    this.hooks = {
      onBusyTap: null,
      onIdle: null,
      busyIdleLatch: new Latch(),
      onData: null,
      onError: null,
    }
    // The gatewaySplitter is used only during the piping phase. It
    // will be null again if you call the join() method as many times
    // as you have called the splitBy() method.
    this.splittersOnTheStack = 0
    this.gatewaySplitter = null
    this.splitterValveOffset = -1 // -1 means n/a
    this.totalIndexValveMap = []
  }

  isIdle(channelType = null) {
    const channelValves = channelType === null ?
      this.channelValves :
      this.channelValves.filter(({channel}) => channel === channelType)
    return channelValves.every(({valve}) => valve.isIdle)
  }

  pipe(valve, channel = CHANNEL_TYPE.DATA) {
    if (!(valve instanceof BaseValve || valve instanceof Splitter)) {
      throw new Error(
        `Expected 'valve' to derive from (or be an instance of) a 'BaseValve' or 'Splitter'`)
    }
    if (!Object.values(CHANNEL_TYPE).includes(channel)) {
      throw new Error(`Unexpected 'channel' name: ${channel}`)
    }

    if (this.gatewaySplitter) {
      this.gatewaySplitter.pipe(valve, channel)
      this.totalIndexValveMap.push({
        topLevelIndex: this.channelValves.length - 1,
        splitterValveOffset: ++this.splitterValveOffset,
      })
    }
    else {
      const valveIndex = this.channelValves.length
      this.splitterValveOffset = -1
      this.totalIndexValveMap.push({
        topLevelIndex: valveIndex,
        splitterValveOffset: this.splitterValveOffset,
      })
      this.channelValves.push({
        channel,
        valve,
      })
      valve.onReady = () => this.nextOrEnd(valveIndex)
      valve.onData = data => this._pump(data, valveIndex + 1, CHANNEL_TYPE.DATA)
      valve.onError = error => this._pump(error, valveIndex + 1, CHANNEL_TYPE.ERROR)
    }

    // The order is important here. First run the pipe(valve) method
    // on the gatewaySplitter, and only then see if the
    // gatewaySplitter needs to be updated.
    if (valve instanceof Splitter) {
      ++this.splittersOnTheStack
      if (this.splittersOnTheStack === 1) {
        this.gatewaySplitter = valve
      }
    }
    return this
  }

  _pump(data, index = 0, channel = CHANNEL_TYPE.DATA) {
    if (channel === CHANNEL_TYPE.ERROR) {
      this.activeChannel = CHANNEL_TYPE.ERROR
    }
    let flushed = false
    for (let i = index; i < this.channelValves.length; ++i) {
      if (this.channelValves[i].channel === channel) {
        this.channelValves[i].valve.push(data)
        flushed = true
        this.next(i)
        break
      }
    }
    if (!flushed) {
      if (channel === CHANNEL_TYPE.DATA && this.hooks.onData) {
        // The onData callback is called regardless of the state of
        // the activeChannel. That's why it should never be made
        // public, or documented in the README file. Users should use
        // the queueTap valve instead.
        this.hooks.onData(data)
      }
      if (channel === CHANNEL_TYPE.ERROR && this.hooks.onError) {
        // The onError callback is called regardless of the state of
        // the activeChannel. That's why it should never be made
        // public, or documented in the README file. Users should use
        // the queueError valve instead.
        this.hooks.onError(data)
      }
    }
  }

  pump(data) {
    if (this.hooks.busyIdleLatch.tryUp() && this.hooks.onBusyTap) {
      try {
        this.hooks.onBusyTap(data)
        this._pump(data, 0, CHANNEL_TYPE.DATA)
      }
      catch (err) {
        this._pump(err, 0, CHANNEL_TYPE.ERROR)
      }
    }
    else {
      this._pump(data, 0, CHANNEL_TYPE.DATA)
    }
    // The pipe is idle here in 3 cases:
    // 1. When there are no valves attached.
    // 2. When all the valves have 0-width buffers.
    // 3. When all the valves are synchronous.
    if (this.isIdle()) {
      this.cleanUp()
    }
  }

  cleanUp() {
    this.activeChannel = CHANNEL_TYPE.DATA
    if (this.hooks.busyIdleLatch.tryDown() && this.hooks.onIdle) {
      try {
        this.hooks.onIdle()
      }
      catch (err) {
        // Users are supposed to handle all the errors in the onIdle hook.
      }
    }
  }

  nextOrEnd(index) {
    if (this.isIdle()) {
      this.cleanUp()
    }
    else if (
      this.activeChannel === CHANNEL_TYPE.ERROR &&
      this.isIdle(CHANNEL_TYPE.ERROR)
    ) {
      this.activeChannel = CHANNEL_TYPE.DATA
      for (let i = 0; i < this.channelValves.length; ++i) {
        this.next(i)
      }
    }
    else {
      this.next(index)
    }
  }

  next(index) {
    if (this.activeChannel === this.channelValves[index].channel) {
      this.channelValves[index].valve.next()
    }
  }

  getChannelValveAt(valveIndex) {
    this.validateChannelValveIdnex(valveIndex)
    return this.channelValves[valveIndex]
  }

  getValveAtTotalIndex(valveIndex) {
    this.validateValveTotalIdnex(valveIndex)
    const { topLevelIndex, splitterValveOffset } = this.totalIndexValveMap[valveIndex]
    const { valve } = this.channelValves[topLevelIndex]
    return { valve, topLevelIndex, splitterValveOffset }
  }

  buffersClearAll() {
    this.channelValves.forEach(({ valve }) => valve.bufferClear())
    // Running nextOrEnd to clean up.
    this.nextOrEnd(0)
  }

  buffersClearOne(valveIndex) {
    const {
      valve,
      splitterValveOffset,
      topLevelIndex,
    } = this.getValveAtTotalIndex(valveIndex)

    if (valve instanceof Splitter) {
      if (splitterValveOffset < 0) {
        valve.bufferClear()
      }
      else {
        valve.buffersClearOne(splitterValveOffset)
      }
    }
    else {
      valve.bufferClear()
    }
    // Running nextOrEnd to clean up.
    this.nextOrEnd(topLevelIndex)
  }

  cacheClearAll() {
    for (const { valve } of this.channelValves) {
      valve.cacheClear()
    }
  }

  cacheClearOne(valveIndex, ...values) {
    const {
      valve,
      splitterValveOffset,
    } = this.getValveAtTotalIndex(valveIndex)

    if (valve instanceof Splitter) {
      if (splitterValveOffset < 0) {
        valve.cacheClear()
      }
      else {
        valve.cacheClearOne(splitterValveOffset, ...values)
      }
    }
    else if (values.length === 0) {
      valve.cacheClear()
    }
    else {
      for (const value of values) {
        valve.cacheClearAt(value)
      }
    }
  }

  onBusyTap(callback) {
    this.validateHookCallback('onBusyTap', callback)
    this.hooks.onBusyTap = callback
    return this
  }

  onIdle(callback) {
    this.validateHookCallback('onIdle', callback)
    this.hooks.onIdle = callback
    return this
  }

  /**
   * Internal.
   * Users should use the queueTap valve instead.
   */
  onData(callback) {
    this.validateHookCallback('onData', callback)
    this.hooks.onData = callback
    return this
  }

  /**
   * Internal.
   * Users should use the queueError valve instead.
   */
  onError(callback) {
    this.validateHookCallback('onError', callback)
    this.hooks.onError = callback
    return this
  }

  queueTap(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.queueTap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  queueMap(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.queueMap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  queueError(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.queueMap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve, CHANNEL_TYPE.ERROR)
  }

  queueEager(intervalMs, options) {
    const preset = Object.assign({}, TimePresets.queueEager, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  queueLazy(intervalMs, options) {
    const preset = Object.assign({}, TimePresets.queueLazy, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  cancelTap(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.cancelTap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  cancelMap(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.cancelMap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  cancelError(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.cancelMap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve, CHANNEL_TYPE.ERROR)
  }

  cancelEager(intervalMs, options) {
    const preset = Object.assign({}, TimePresets.cancelEager, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  cancelLazy(intervalMs, options) {
    const preset = Object.assign({}, TimePresets.cancelLazy, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  throttleTap(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.throttleTap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  throttleMap(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.throttleMap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  throttleError(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.throttleMap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve, CHANNEL_TYPE.ERROR)
  }

  throttleEager(intervalMs, options) {
    const preset = Object.assign({}, TimePresets.throttleEager, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  throttleLazy(intervalMs, options) {
    const preset = Object.assign({}, TimePresets.throttleLazy, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  skipTap(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.skipTap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  skipMap(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.skipMap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  skipError(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.skipMap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve, CHANNEL_TYPE.ERROR)
  }

  skipEager(intervalMs, options) {
    const preset = Object.assign({}, TimePresets.skipEager, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  skipLazy(intervalMs, options) {
    const preset = Object.assign({}, TimePresets.skipLazy, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  sliceTap(chunkSize, promiseFactory, options) {
    const preset = Object.assign({
      maxBufferSize: chunkSize,
    }, PromisePresets.sliceTap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  sliceMap(chunkSize, promiseFactory, options) {
    const preset = Object.assign({
      maxBufferSize: chunkSize,
    }, PromisePresets.sliceMap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  sliceEager(chunkSize, intervalMs, options) {
    const preset = Object.assign({
      maxBufferSize: chunkSize,
    }, TimePresets.sliceEager, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  sliceLazy(chunkSize, intervalMs, options) {
    const preset = Object.assign({
      maxBufferSize: chunkSize,
    }, TimePresets.sliceLazy, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  poolTap(poolSize, promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.queueTap, {poolSize}, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  poolMap(poolSize, promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.queueMap, {poolSize}, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  flatten(options) {
    const preset = Object.assign({}, BasePresets.queue, options)
    const valve = new FlattenValve(preset)
    return this.pipe(valve)
  }

  map(transformFunc, options) {
    const preset = Object.assign({}, BasePresets.queue, options)
    const valve = new MapValve(preset, transformFunc)
    return this.pipe(valve)
  }

  filter(predicateFunc, options) {
    const preset = Object.assign({}, BasePresets.queue, options)
    const valve = new FilterValve(preset, predicateFunc)
    return this.pipe(valve)
  }

  splitBy(poolSize, classifyFn) {
    const splitter = new Splitter(poolSize, classifyFn)
    this.pipe(splitter)
    return this
  }

  join() {
    if (this.splittersOnTheStack < 1) {
      throw new Error('There are no splitters to join')
    }
    --this.splittersOnTheStack
    if (this.splittersOnTheStack > 0) {
      this.gatewaySplitter.join()
    }
    else {
      this.gatewaySplitter = null
    }
    return this
  }

  validateChannelValveIdnex(valveIndex) {
    if (typeof valveIndex !== 'number' ||
        valveIndex < 0 ||
        valveIndex >= this.channelValves.length) {
      throw new Error(`Expected valveIndex to be a 'number' greater than 0 and smaller than ${this.channelValves.length}; found: ${ valveIndex }`)
    }
  }

  validateValveTotalIdnex(valveIndex) {
    if (typeof valveIndex !== 'number' ||
        valveIndex < 0 ||
        valveIndex >= this.totalIndexValveMap.length) {
      throw new Error(`Expected valveIndex to be a 'number' greater than 0 and smaller than ${this.totalIndexValveMap.length}; found: ${ valveIndex }`)
    }
  }

  validateHookCallback(hookName, callback) {
    if (typeof callback !== 'function') {
      throw new Error(`Unexpected 'callback': ${callback}`)
    }
    if (this.hooks[hookName]) {
      throw new Error('Only one callback allowed')
    }
  }
}

module.exports = {
  MoonPipe,
}

// Splitter has to be initialized after the module.exports because it
// is a circular dependency.
Splitter = require('./Splitter.js').Splitter
