'use strict'

const { BaseValve, CHANNEL_TYPE } = require('./BaseValve.js')

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
  SynchronousPresets,
} = require('./SynchronousValves.js')

let Splitter, SplitterPresets

const { Latch } = require('./Latch.js')

/**
 * @template D_IN, D_OUT
 */
class MoonPipe {

  constructor() {
    this.channelValves = []
    // Entries in 'valvesByName' point to either a valve, or a
    // top-level splitter holding the valve. Only valves that have a
    // name are included.
    this.valvesByName = {}
    this.activeChannel = CHANNEL_TYPE.DATA
    this.history = []
    this.hooks = {
      onBusyTap: null, // DEPRECATED
      onBusy: null,
      onIdle: null,
      resolve: null,
      busyIdleLatch: new Latch(),
      onData: null,
      onError: null,
    }
    // The gatewaySplitter is used only during the piping phase. It
    // will be null again if you call the join() method as many times
    // as you have called the splitBy() method.
    this.splittersOnTheStack = 0
    this.gatewaySplitter = null
  }

  /**
   * @param {string} [channelType]
   * @returns {boolean}
   */
  isIdle(channelType = null) {
    const channelValves = channelType === null ?
      this.channelValves :
      this.channelValves.filter(({inputChannel}) => inputChannel === channelType)
    return channelValves.every(({valve}) => valve.isIdle)
  }

  /**
   * @param {BaseValve|Splitter} valve
   * @param {string} [inputChannel]
   * @param {string} [outputChannel]
   * @returns {MoonPipe<D_IN, *>}
   */
  pipe(valve, inputChannel = CHANNEL_TYPE.DATA, outputChannel = CHANNEL_TYPE.DATA) {
    if (!(valve instanceof BaseValve || valve instanceof Splitter)) {
      throw new Error(
        `Expected 'valve' to derive from (or be an instance of) a 'BaseValve' or 'Splitter'`)
    }
    if (!Object.values(CHANNEL_TYPE).includes(inputChannel)) {
      throw new Error(`Unexpected 'inputChannel' name: ${inputChannel}`)
    }
    if (!Object.values(CHANNEL_TYPE).includes(outputChannel)) {
      throw new Error(`Unexpected 'outputChannel' name: ${outputChannel}`)
    }

    if (valve.hasName) {
      if (this.valvesByName[valve.name]) {
        throw new Error(`A valve named: '${valve.name}' already exists`)
      }
    }

    // Only for now, to make sure that the DEPRECATED solution works
    if (valve.outputChannel === CHANNEL_TYPE.ERROR) {
      outputChannel = CHANNEL_TYPE.ERROR
    }

    if (this.gatewaySplitter) {
      if (valve.hasName) {
        // Valves from inside a Splitter cannot be accessed
        // directly. They will be available through the top-level
        // Splitter.
        this.valvesByName[valve.name] = this.gatewaySplitter
      }
      this.gatewaySplitter.pipe(valve, inputChannel, outputChannel)
    }
    else {
      if (valve.hasName) {
        this.valvesByName[valve.name] = valve
      }
      const valveIndex = this.channelValves.length
      this.channelValves.push({
        inputChannel,
        outputChannel,
        valve,
      })
      valve.onReady = () => this.nextOrEnd(valveIndex)
      valve.onData = data => this._pump(data, valveIndex + 1, outputChannel)
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

  /**
   * For INTERNAL use only.
   * @private
   */
  _pump(data, index = 0, channel = CHANNEL_TYPE.DATA) {
    if (channel === CHANNEL_TYPE.ERROR) {
      this.activeChannel = CHANNEL_TYPE.ERROR
    }
    let flushed = false
    for (let i = index; i < this.channelValves.length; ++i) {
      if (this.channelValves[i].inputChannel === channel) {
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

  /**
   * @param {D_IN} data
   * @returns {void}
   */
  pump(data) {
    this.history = [data]
    // I need the shouldPump flag only until I remove the DEPRECATED
    // onBusyTap hook.
    let shouldPump = true
    if (this.hooks.busyIdleLatch.tryUp()) {
      if (this.hooks.onBusyTap) {
        try {
          this.hooks.onBusyTap(data)
        }
        catch (err) {
          shouldPump = false
          this._pump(err, 0, CHANNEL_TYPE.ERROR)
        }
      }
      if (this.hooks.onBusy) {
        try {
          this.hooks.onBusy()
        }
        catch (err) {
          // Users are supposed to handle all the errors in the onBusy hook.
        }
      }
    }
    if (shouldPump) {
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


  /**
   * @returns {void}
   */
  rePumpLast() {
    if (this.history.length < 1) {
      throw new Error('The history buffer is empty')
    }
    this.pump(this.history.at(-1))
  }

  /**
   * @returns {Promise<void>}
   */
  getOnIdlePromise() {
    if (this.hooks['resolve']) {
      throw new Error('Only one onIdlePromise allowed')
    }
    return new Promise((resolve) => {
      this.hooks.resolve = resolve
    })
  }

  /**
   * For INTERNAL use only.
   * @private
   */
  cleanUp() {
    this.activeChannel = CHANNEL_TYPE.DATA
    if (this.hooks.busyIdleLatch.tryDown()) {
      if (this.hooks.onIdle) {
        try {
          this.hooks.onIdle()
        }
        catch (err) {
          // Users are supposed to handle all the errors in the onIdle hook.
        }
      }
      if (this.hooks.resolve) {
        this.hooks.resolve()
        this.hooks.resolve = null
      }
    }
  }

  /**
   * For INTERNAL use only.
   * @private
   */
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

  /**
   * For INTERNAL use only.
   * @private
   */
  next(index) {
    if (this.activeChannel === this.channelValves[index].inputChannel) {
      this.channelValves[index].valve.next()
    }
  }

  /**
   * @param {number} valveIndex
   * @returns {{inputChannel: string, outputChannel: string, valve: BaseValve|Splitter}}
   */
  getChannelValveAt(valveIndex) {
    this.validateChannelValveIdnex(valveIndex)
    return this.channelValves[valveIndex]
  }

  /**
   * Returns either a valve, or a top-level splitter holding the valve.
   * @param {string} valveName
   * @returns {BaseValve|Splitter}
   */
  getTopLevelValveFor(valveName) {
    if (typeof valveName !== 'string') {
      throw new Error(`Expected valveName to be a 'string'; found: ${ valveName }`)
    }
    const valve = this.valvesByName[valveName]
    if (!valve) {
      throw new Error(`A valve named: '${valveName}' does not exist`)
    }
    return valve
  }

  /**
   * @returns {void}
   */
  buffersClearAll() {
    this.channelValves.forEach(({ valve }) => valve.bufferClear())
    // Calling nextOrEnd to clean up, or change the activeChannel.
    // The 0 argument passed to the method is irrelevant.
    this.nextOrEnd(0)
  }

  /**
   * @param {string} valveName
   * @returns {void}
   */
  buffersClearOne(valveName) {
    const valve = this.getTopLevelValveFor(valveName)
    if (valve instanceof Splitter) {
      if (valve.name === valveName) {
        valve.bufferClear()
      }
      else {
        valve.buffersClearOne(valveName)
      }
    }
    else {
      valve.bufferClear()
    }
    // Calling nextOrEnd to clean up, or change the activeChannel.
    // The 0 argument passed to the method is irrelevant.
    this.nextOrEnd(0)
  }

  /**
   * @returns {void}
   */
  cacheClearAll() {
    for (const { valve } of this.channelValves) {
      valve.cacheClear()
    }
  }

  /**
   * @param {string} valveName
   * @param {...*} values
   * @returns {void}
   */
  cacheClearOne(valveName, ...values) {
    const valve = this.getTopLevelValveFor(valveName)
    if (valve instanceof Splitter) {
      if (valve.name === valveName) {
        valve.cacheClear()
      }
      else {
        valve.cacheClearOne(valveName, ...values)
      }
    }
    else if (values.length === 0) {
      valve.cacheClear()
    }
    else {
      valve.cacheClearAt(...values)
    }
  }

  /**
   * @param {string} valveName
   * @param {function(*, *): boolean} predicateFunc
   * @returns {void}
   */
  cacheClearByResult(valveName, predicateFunc) {
    const valve = this.getTopLevelValveFor(valveName)
    if (valve instanceof Splitter) {
      if (valve.name === valveName) {
        throw new Error('cacheClearByResult is not supported on Splitters')
      }
      else {
        valve.cacheClearByResult(valveName, predicateFunc)
      }
    }
    else if (valve instanceof PromiseValve) {
      valve.cacheClearByResult(predicateFunc)
    }
    else {
      throw new Error('cacheClearByResult is supported only on PromiseValves')
    }
  }

  /**
   * @param {string} valveName
   * @param {function(*, *): *} transformFunc
   * @returns {void}
   */
  cacheUpdateByResult(valveName, transformFunc) {
    const valve = this.getTopLevelValveFor(valveName)
    if (valve instanceof Splitter) {
      if (valve.name === valveName) {
        throw new Error('cacheUpdateByResult is not supported on Splitters')
      }
      else {
        valve.cacheUpdateByResult(valveName, transformFunc)
      }
    }
    else if (valve instanceof PromiseValve) {
      valve.cacheUpdateByResult(transformFunc)
    }
    else {
      throw new Error('cacheUpdateByResult is supported only on PromiseValves')
    }
  }

  /**
   * @param {string} valveName
   * @param {*} value
   * @param {*} result
   * @returns {void}
   */
  cachePopulate(valveName, value, result) {
    const valve = this.getTopLevelValveFor(valveName)
    if (valve instanceof Splitter) {
      if (valve.name === valveName) {
        throw new Error('cachePopulate is not supported on Splitters')
      }
      else {
        valve.cachePopulate(valveName, value, result)
      }
    }
    else if (valve instanceof PromiseValve){
      valve.cachePopulate(value, result)
    }
    else {
      throw new Error('cachePopulate is supported only on PromiseValves')
    }
  }

  /**
   * @deprecated
   * @param {function(D_IN): void} callback
   * @returns {MoonPipe<D_IN, D_OUT>}
   */
  onBusyTap(callback) {
    this.validateHookCallback('onBusyTap', callback)
    this.hooks.onBusyTap = callback
    return this
  }

  /**
   * @param {function(): void} callback
   * @returns {MoonPipe<D_IN, D_OUT>}
   */
  onBusy(callback) {
    this.validateHookCallback('onBusy', callback)
    this.hooks.onBusy = callback
    return this
  }

  /**
   * @param {function(): void} callback
   * @returns {MoonPipe<D_IN, D_OUT>}
   */
  onIdle(callback) {
    this.validateHookCallback('onIdle', callback)
    this.hooks.onIdle = callback
    return this
  }

  /**
   * For INTERNAL use only.
   * Users should use the queueTap valve instead.
   */
  onData(callback) {
    this.validateHookCallback('onData', callback)
    this.hooks.onData = callback
    return this
  }

  /**
   * For INTERNAL use only.
   * Users should use the queueError valve instead.
   */
  onError(callback) {
    this.validateHookCallback('onError', callback)
    this.hooks.onError = callback
    return this
  }

  /**
   * @typedef {import("./RichPromise.js").PromiseContext} PromiseContext
   */

  /**
   * @template P_OUT
   * @callback PromiseFactory
   * @param {D_OUT} value
   * @param {PromiseContext} context
   * @returns {Promise<P_OUT>}
   */

  /**
   * @template P_OUT
   * @callback ErrorPromiseFactory
   * @param {Error} value
   * @param {PromiseContext} context
   * @returns {Promise<P_OUT>}
   */

  /**
   * @template P_OUT
   * @callback SlicePromiseFactory
   * @param {Array<D_OUT>} value
   * @param {PromiseContext} context
   * @returns {Promise<P_OUT>}
   */

  /**
   * @typedef {Object} PromisePreset
   * @property {string} [name]
   * @property {number} [maxBufferSize]
   * @property {string} [bufferType]
   * @property {string} [overflowAction]
   * @property {string} [resolveType]
   * @property {boolean} [cancelOnPump]
   * @property {number} [timeoutMs]
   * @property {number} [poolSize]
   * @property {boolean} [cache]
   * @property {function(D_OUT): *} [hashFunction]
   * @property {function(number, Error): boolean} [repeatPredicate]
   * @property {function(): {nextDelayMs: function(): number}} [repeatBackoffFactory]
   */

  /**
   * @typedef {Object} TimePreset
   * @property {string} [name]
   * @property {number} [maxBufferSize]
   * @property {string} [bufferType]
   * @property {string} [overflowAction]
   * @property {string} [resolveType]
   * @property {boolean} [cancelOnPump]
   */

  /**
   * @typedef {Object} SynchronousPreset
   * @property {string} [name]
   * @property {number} [maxBufferSize]
   * @property {string} [bufferType]
   * @property {string} [overflowAction]
   */

  /**
   * @typedef {Object} SplitterPreset
   * @property {string} [name]
   * @property {number} [poolSize]
   */

  /**
   * @template P_OUT
   * @param {PromiseFactory<P_OUT>} promiseFactory
   * @param {PromisePreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT>}
   */
  queueTap(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.queueTap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  /**
   * @template P_OUT
   * @param {PromiseFactory<P_OUT>} promiseFactory
   * @param {PromisePreset} [options]
   * @returns {MoonPipe<D_IN, P_OUT>}
   */
  queueMap(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.queueMap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  /**
   * @template P_OUT
   * @param {ErrorPromiseFactory<P_OUT>} promiseFactory
   * @param {PromisePreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT|P_OUT>}
   */
  queueError(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.queueMap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve, CHANNEL_TYPE.ERROR)
  }

  /**
   * @param {number} intervalMs
   * @param {TimePreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT>}
   */
  queueEager(intervalMs, options) {
    const preset = Object.assign({}, TimePresets.queueEager, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  /**
   * @param {number} intervalMs
   * @param {TimePreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT>}
   */
  queueLazy(intervalMs, options) {
    const preset = Object.assign({}, TimePresets.queueLazy, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  /**
   * @template P_OUT
   * @param {PromiseFactory<P_OUT>} promiseFactory
   * @param {PromisePreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT>}
   */
  cancelTap(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.cancelTap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  /**
   * @template P_OUT
   * @param {PromiseFactory<P_OUT>} promiseFactory
   * @param {PromisePreset} [options]
   * @returns {MoonPipe<D_IN, P_OUT>}
   */
  cancelMap(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.cancelMap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  /**
   * @template P_OUT
   * @param {ErrorPromiseFactory<P_OUT>} promiseFactory
   * @param {PromisePreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT|P_OUT>}
   */
  cancelError(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.cancelMap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve, CHANNEL_TYPE.ERROR)
  }

  /**
   * @param {number} intervalMs
   * @param {TimePreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT>}
   */
  cancelEager(intervalMs, options) {
    const preset = Object.assign({}, TimePresets.cancelEager, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  /**
   * @param {number} intervalMs
   * @param {TimePreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT>}
   */
  cancelLazy(intervalMs, options) {
    const preset = Object.assign({}, TimePresets.cancelLazy, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  /**
   * @template P_OUT
   * @param {PromiseFactory<P_OUT>} promiseFactory
   * @param {PromisePreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT>}
   */
  throttleTap(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.throttleTap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  /**
   * @template P_OUT
   * @param {PromiseFactory<P_OUT>} promiseFactory
   * @param {PromisePreset} [options]
   * @returns {MoonPipe<D_IN, P_OUT>}
   */
  throttleMap(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.throttleMap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  /**
   * @template P_OUT
   * @param {ErrorPromiseFactory<P_OUT>} promiseFactory
   * @param {PromisePreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT|P_OUT>}
   */
  throttleError(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.throttleMap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve, CHANNEL_TYPE.ERROR)
  }

  /**
   * @param {number} intervalMs
   * @param {TimePreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT>}
   */
  throttleEager(intervalMs, options) {
    const preset = Object.assign({}, TimePresets.throttleEager, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  /**
   * @param {number} intervalMs
   * @param {TimePreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT>}
   */
  throttleLazy(intervalMs, options) {
    const preset = Object.assign({}, TimePresets.throttleLazy, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  /**
   * @template P_OUT
   * @param {PromiseFactory<P_OUT>} promiseFactory
   * @param {PromisePreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT>}
   */
  skipTap(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.skipTap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  /**
   * @template P_OUT
   * @param {PromiseFactory<P_OUT>} promiseFactory
   * @param {PromisePreset} [options]
   * @returns {MoonPipe<D_IN, P_OUT>}
   */
  skipMap(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.skipMap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  /**
   * @template P_OUT
   * @param {ErrorPromiseFactory<P_OUT>} promiseFactory
   * @param {PromisePreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT|P_OUT>}
   */
  skipError(promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.skipMap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve, CHANNEL_TYPE.ERROR)
  }

  /**
   * @param {number} intervalMs
   * @param {TimePreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT>}
   */
  skipEager(intervalMs, options) {
    const preset = Object.assign({}, TimePresets.skipEager, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  /**
   * @param {number} intervalMs
   * @param {TimePreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT>}
   */
  skipLazy(intervalMs, options) {
    const preset = Object.assign({}, TimePresets.skipLazy, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  /**
   * @template P_OUT
   * @param {number} chunkSize
   * @param {SlicePromiseFactory<P_OUT>} promiseFactory
   * @param {PromisePreset} [options]
   * @returns {MoonPipe<D_IN, Array<D_OUT>>}
   */
  sliceTap(chunkSize, promiseFactory, options) {
    const preset = Object.assign({
      maxBufferSize: chunkSize,
    }, PromisePresets.sliceTap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  /**
   * @template P_OUT
   * @param {number} chunkSize
   * @param {SlicePromiseFactory<P_OUT>} promiseFactory
   * @param {PromisePreset} [options]
   * @returns {MoonPipe<D_IN, P_OUT>}
   */
  sliceMap(chunkSize, promiseFactory, options) {
    const preset = Object.assign({
      maxBufferSize: chunkSize,
    }, PromisePresets.sliceMap, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  /**
   * @param {number} chunkSize
   * @param {number} intervalMs
   * @param {TimePreset} [options]
   * @returns {MoonPipe<D_IN, Array<D_OUT>>}
   */
  sliceEager(chunkSize, intervalMs, options) {
    const preset = Object.assign({
      maxBufferSize: chunkSize,
    }, TimePresets.sliceEager, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  /**
   * @param {number} chunkSize
   * @param {number} intervalMs
   * @param {TimePreset} [options]
   * @returns {MoonPipe<D_IN, Array<D_OUT>>}
   */
  sliceLazy(chunkSize, intervalMs, options) {
    const preset = Object.assign({
      maxBufferSize: chunkSize,
    }, TimePresets.sliceLazy, options)
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  /**
   * @template P_OUT
   * @param {number} poolSize
   * @param {PromiseFactory<P_OUT>} promiseFactory
   * @param {PromisePreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT>}
   */
  poolTap(poolSize, promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.queueTap, {poolSize}, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  /**
   * @template P_OUT
   * @param {number} poolSize
   * @param {PromiseFactory<P_OUT>} promiseFactory
   * @param {PromisePreset} [options]
   * @returns {MoonPipe<D_IN, P_OUT>}
   */
  poolMap(poolSize, promiseFactory, options) {
    const preset = Object.assign({}, PromisePresets.queueMap, {poolSize}, options)
    const valve = new PromiseValve(preset, promiseFactory)
    return this.pipe(valve)
  }

  /**
   * @param {SynchronousPreset} [options]
   * @returns {MoonPipe<D_IN, *>}
   */
  flatten(options) {
    const preset = Object.assign({}, SynchronousPresets.dataOut, options)
    const valve = new FlattenValve(preset)
    return this.pipe(valve)
  }

  /**
   * @template T_OUT
   * @param {function(D_OUT): T_OUT} transformFunc
   * @param {SynchronousPreset} [options]
   * @returns {MoonPipe<D_IN, T_OUT>}
   */
  map(transformFunc, options) {
    const preset = Object.assign({}, SynchronousPresets.dataOut, options)
    const valve = new MapValve(preset, transformFunc)
    return this.pipe(valve)
  }

  /**
   * @param {function(D_OUT): boolean} predicateFunc
   * @param {SynchronousPreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT>}
   */
  filter(predicateFunc, options) {
    const preset = Object.assign({}, SynchronousPresets.dataOut, options)
    const valve = new FilterValve(preset, predicateFunc)
    return this.pipe(valve)
  }

  /**
   * @template {Error} E_IN
   * @param {function(E_IN): boolean} predicateFunc
   * @param {SynchronousPreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT|E_IN>}
   */
  filterError(predicateFunc, options) {
    const preset = Object.assign({}, SynchronousPresets.errorOut, options)
    const valve = new FilterValve(preset, predicateFunc)
    return this.pipe(valve, CHANNEL_TYPE.ERROR, CHANNEL_TYPE.ERROR)
    // Keep it for now, to easily test that the DEPRECATED solution keeps working.
    // return this.pipe(valve, CHANNEL_TYPE.ERROR)
  }

  /**
   * @param {number} poolSize
   * @param {function(D_OUT): *} classifyFn
   * @param {SplitterPreset} [options]
   * @returns {MoonPipe<D_IN, D_OUT>}
   */
  splitBy(poolSize, classifyFn, options) {
    const preset = Object.assign({}, SplitterPresets.basic, {poolSize}, options)
    const splitter = new Splitter(preset, classifyFn)
    this.pipe(splitter)
    return this
  }

  /**
   * @returns {MoonPipe<D_IN, D_OUT>}
   */
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

  /**
   * @param {number} valveIndex
   * @returns {void}
   */
  validateChannelValveIdnex(valveIndex) {
    if (typeof valveIndex !== 'number' ||
        valveIndex < 0 ||
        valveIndex >= this.channelValves.length) {
      throw new Error(`Expected valveIndex to be a 'number' greater than 0 and smaller than ${this.channelValves.length}; found: ${ valveIndex }`)
    }
  }

  /**
   * @param {string} hookName
   * @param {function} callback
   * @returns {void}
   */
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
SplitterPresets = require('./Splitter.js').SplitterPresets
