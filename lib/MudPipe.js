'use strict'

const {
  PromiseValve,
  PromisePresets,
} = require('./PromiseValve.js')

const {
  TimeValve,
  TimePresets,
} = require('./TimeValve.js')

const OPERATION_MODE = {
  DATA: 'DATA',
  ERROR: 'ERROR',
}

class MudPipe {

  constructor() {
    this.valves = []
    this.errors = []
    this.operationMode = OPERATION_MODE.DATA
    this.errorHandler = async error => {
      console.log('MudPipe default error handler:', error.message)
    }
  }

  handleError(errorHandler) {
    this.errorHandler = errorHandler
    return this
  }

  pipe(valve) {
    const valveIndex = this.valves.length
    this.valves.push(valve)
    valve.onReady = () => this.next(valveIndex)
    valve.onData = data => this.pump(data, valveIndex + 1)
    valve.onError = error => this.onError(error)
    return this
  }

  pump(data, index = 0) {
    if (this.valves.length > index) {
      this.valves[index].push(data)
      this.next(index)
    }
  }

  next(index) {
    if (this.operationMode === OPERATION_MODE.DATA) {
      this.valves[index].next()
    }
  }

  cacheClear() {
    for (const valve of this.valves) {
      valve.cacheClear()
    }
  }

  cacheClearOne(value) {
    for (const valve of this.valves) {
      valve.cacheClearOne(value)
    }
  }

  async onError(error) {
    this.errors.push(error)
    if (this.operationMode !== OPERATION_MODE.ERROR) {
      this.operationMode = OPERATION_MODE.ERROR
      while (this.errors.length > 0) {
        const error = this.errors.shift()
        await this.errorHandler(error)
      }
      this.operationMode = OPERATION_MODE.DATA
      for (let i = 0; i < this.valves.length; ++i) {
        this.next(i)
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

  queueEager(intervalMs) {
    const preset = TimePresets.queueEager
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  queueLazy(intervalMs) {
    const preset = TimePresets.queueLazy
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

  cancelEager(intervalMs) {
    const preset = TimePresets.cancelEager
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  cancelLazy(intervalMs) {
    const preset = TimePresets.cancelLazy
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

  throttleEager(intervalMs) {
    const preset = TimePresets.throttleEager
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  throttleLazy(intervalMs) {
    const preset = TimePresets.throttleLazy
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

  skipEager(intervalMs) {
    const preset = TimePresets.skipEager
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }

  skipLazy(intervalMs) {
    const preset = TimePresets.skipLazy
    const valve = new TimeValve(preset, intervalMs)
    return this.pipe(valve)
  }
}

module.exports = {
  MudPipe,
}
