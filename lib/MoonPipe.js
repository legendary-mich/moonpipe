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

const CHANNEL_TYPE = {
  DATA: 'DATA',
  ERROR: 'ERROR',
}

class MoonPipe {

  constructor() {
    this.channelValves = []
    this.activeChannel = CHANNEL_TYPE.DATA
  }

  pipe(valve, channel = CHANNEL_TYPE.DATA) {
    if (!(valve instanceof BaseValve)) {
      throw new Error(
        `Expected 'valve' to derive from (or be an instance of) a 'BaseValve'`)
    }
    if (!Object.values(CHANNEL_TYPE).includes(channel)) {
      throw new Error(`Unexpected 'channel' name: ${channel}`)
    }

    const valveIndex = this.channelValves.length
    this.channelValves.push({
      channel,
      valve,
    })
    valve.onReady = () => this.onReady(valveIndex)
    valve.onData = data => this.pump(data, valveIndex + 1, CHANNEL_TYPE.DATA)
    valve.onError = error => {
      this.activeChannel = CHANNEL_TYPE.ERROR
      this.pump(error, valveIndex + 1, CHANNEL_TYPE.ERROR)
    }
    return this
  }

  pump(data, index = 0, channel = CHANNEL_TYPE.DATA) {
    for (let i = index; i < this.channelValves.length; ++i) {
      if (this.channelValves[i].channel === channel) {
        this.channelValves[i].valve.push(data)
        this.next(i)
        break
      }
    }
  }

  onReady(index) {
    if (
      this.activeChannel === CHANNEL_TYPE.ERROR &&
      this.channelValves.filter(({channel}) => channel === CHANNEL_TYPE.ERROR)
        .every(({valve}) => valve.isEmpty)
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
    this.validateValveIdnex(valveIndex)
    return this.channelValves[valveIndex]
  }

  buffersClearAll() {
    this.channelValves.forEach(({ valve }) => valve.bufferClear())
  }

  buffersClearOne(valveIndex) {
    const { valve } = this.getChannelValveAt(valveIndex)
    valve.bufferClear()
  }

  cacheClearAll() {
    for (const { valve } of this.channelValves) {
      valve.cacheClear()
    }
  }

  cacheClearOne(valveIndex, ...values) {
    const { valve } = this.getChannelValveAt(valveIndex)
    if (values.length === 0) {
      valve.cacheClear()
    }
    else {
      for (const value of values) {
        valve.cacheClearAt(value)
      }
    }
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

  validateValveIdnex(valveIndex) {
    if (typeof valveIndex !== 'number' ||
        valveIndex < 0 ||
        valveIndex >= this.channelValves.length) {
      throw new Error(`Expected valveIndex to be a 'number' greater than 0 and smaller than ${this.channelValves.length}; found: ${ valveIndex }`)
    }
  }
}

module.exports = {
  MoonPipe,
}
