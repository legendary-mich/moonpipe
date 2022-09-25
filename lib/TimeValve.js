'use strict'

const { BaseValve, BUFFER_TYPE, OVERFLOW_ACTION, MAX_ARRAY_SIZE } = require('./BaseValve.js')
const TIME_RESOLVE_TYPE = {
  EAGER: 'EAGER',
  LAZY: 'LAZY',
}

class TimeValve extends BaseValve {

  constructor(preset, intervalMs) {
    super(preset)
    validatePreset(preset, intervalMs)
    this.cancelOnPump = preset.cancelOnPump
    this.resolveType = preset.resolveType

    this.intervalMs = intervalMs
  }

  get activeTimeout() {
    return this._activeTimeout
  }
  set activeTimeout(value) {
    clearTimeout(this._activeTimeout)
    this._activeTimeout = value
  }

  bufferClear() {
    super.bufferClear()
    this.activeTimeout = null
  }

  next() {
    const shouldEmitImmediately = this.buffer.length > 0 &&
      this.resolveType === TIME_RESOLVE_TYPE.EAGER &&
      !this.activeTimeout

    const shouldSetTimeout = this.buffer.length > 0 &&
      (!this.activeTimeout || this.cancelOnPump)

    if (shouldSetTimeout) {
      this.activeTimeout = setTimeout(() => {
        this.activeTimeout = null
        if (this.resolveType === TIME_RESOLVE_TYPE.LAZY) {
          this.onData(this.pluck())
        }
        if (shouldEmitImmediately) {
          this.numberOfReservedSlots--
        }
        this.onReady()
      }, this.intervalMs)
    }

    if (shouldEmitImmediately) {
      this.numberOfReservedSlots++
      this.onData(this.pluck())
    }
  }
}

function validatePreset(preset, intervalMs) {
  if (typeof preset.cancelOnPump !== 'boolean') {
    throw new Error(`Unexpected 'cancelOnPump': ${preset.cancelOnPump}`)
  }
  if (!Object.values(TIME_RESOLVE_TYPE).includes(preset.resolveType)) {
    throw new Error(`Unexpected 'resolveType': ${preset.resolveType}`)
  }
  if (typeof intervalMs !== 'number' || intervalMs < 0) {
    throw new Error(`Expected intervalMs to be a 'number' greater or equal to 0; found: ${intervalMs}`)
  }
}

const queueLazy = {
  maxBufferSize: MAX_ARRAY_SIZE,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
  resolveType: TIME_RESOLVE_TYPE.LAZY,
  cancelOnPump: false,
}
const cancelLazy = {
  maxBufferSize: 1,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.SHIFT,
  resolveType: TIME_RESOLVE_TYPE.LAZY,
  cancelOnPump: true,
}
const throttleLazy = {
  maxBufferSize: 1,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.SHIFT,
  resolveType: TIME_RESOLVE_TYPE.LAZY,
  cancelOnPump: false,
}
const skipLazy = {
  maxBufferSize: 1,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.SKIP,
  resolveType: TIME_RESOLVE_TYPE.LAZY,
  cancelOnPump: false,
}
const sliceLazy = {
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.SLICE,
  resolveType: TIME_RESOLVE_TYPE.LAZY,
  cancelOnPump: false,
}

function eagerPreset(basePreset) {
  return Object.assign({}, basePreset, { resolveType: TIME_RESOLVE_TYPE.EAGER })
}

module.exports = {
  TimeValve,
  TIME_RESOLVE_TYPE,
  TimePresets: {
    queueLazy,
    cancelLazy,
    throttleLazy,
    skipLazy,
    sliceLazy,
    queueEager: eagerPreset(queueLazy),
    cancelEager: eagerPreset(cancelLazy),
    throttleEager: eagerPreset(throttleLazy),
    skipEager: eagerPreset(skipLazy),
    sliceEager: eagerPreset(sliceLazy),
  },
}
