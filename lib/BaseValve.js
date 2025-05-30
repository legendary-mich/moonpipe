'use strict'

const MAX_ARRAY_SIZE = 2**32-1

const BUFFER_TYPE = {
  QUEUE: 'QUEUE',
}

const CHANNEL_TYPE = {
  DATA: 'DATA',
  ERROR: 'ERROR',
}

const OVERFLOW_ACTION = {
  EMIT_ERROR: 'EMIT_ERROR',
  SHIFT: 'SHIFT',
  SLICE: 'SLICE',
  SKIP: 'SKIP',
}

class BufferOverflowError extends Error {
  constructor() {
    super('Buffer overflow')
  }
}

class BaseValve {

  constructor(preset) {
    validatePreset(preset)
    this.name = preset.name
    this.buffer = []
    this.bufferType = preset.bufferType
    this.maxBufferSize = preset.maxBufferSize
    this.numberOfReservedSlots = 0
    this.overflowAction = preset.overflowAction
    this.squashDownTo = preset.squashDownTo
    // DEPRECATED
    this.outputChannel = preset.outputChannel || CHANNEL_TYPE.DATA

    this.preset = preset

    this.onData = (data) => {} // eslint-disable-line no-unused-vars
    this.onError = (err) => {} // eslint-disable-line no-unused-vars
    this.onReady = () => {}
  }

  clone() {
    return new BaseValve(this.preset)
  }

  get hasName() {
    return typeof this.name === 'string'
  }

  get numberOfFreeSlots() {
    return this.maxBufferSize - this.numberOfReservedSlots - this.buffer.length
  }

  get isIdle() {
    return this.buffer.length < 1 && this.numberOfReservedSlots < 1
  }

  pluck() {
    switch (this.bufferType) {
    case BUFFER_TYPE.QUEUE:
      return this.buffer.shift()
    default:
      throw new Error(`Unknown bufferType (${ this.bufferType })`)
    }
  }

  push(data) {
    if (this.squashDownTo) {
      try {
        const target = this.squashDownTo(data)
        const index = this.buffer.findIndex(val => this.squashDownTo(val) === target)
        if (index >= 0) {
          this.buffer.splice(index)
        }
      }
      catch (err) {
        this.onError(err)
        return
      }
    }
    if (this.overflowAction === OVERFLOW_ACTION.SLICE) {
      let lastSlice = this.buffer[this.buffer.length - 1]
      if (!lastSlice || lastSlice.length >= this.maxBufferSize) {
        lastSlice = []
        this.buffer.push(lastSlice)
      }
      lastSlice.push(data)
    }
    else {
      if (this.numberOfFreeSlots < 1) {
        switch (this.overflowAction) {
        case OVERFLOW_ACTION.EMIT_ERROR:
          this.onError(new BufferOverflowError())
          return
        case OVERFLOW_ACTION.SKIP:
          return
        case OVERFLOW_ACTION.SHIFT:
          // The buffer will be empty (length === 0) when
          // maxBufferSize === numberOfReservedSlots
          // There will be nothing to shift in this case.
          if (this.buffer.length > 0) { this.buffer.shift() }
          break
        default:
          throw new Error(`Unknown overflowAction (${ this.overflowAction })`)
        }
      }
      // It is OK to push to the buffer for
      // (numberOfFreeSlots < 1) when (overflowAction === SHIFT).
      // We need it this way because OVERFLOW_ACTION.SHIFT creates a
      // short-lived buffer underflow when there's nothing to shift.
      this.buffer.push(data)
    }
  }

  next() {
    if (this.buffer.length > 0) {
      this.onData(this.pluck())
      this.onReady()
    }
  }

  // DEPRECATED - use onData directly instead
  emitOut(val) {
    this.onData(val)
  }

  // DEPRECATED - use onError directly instead
  emitErr(err) {
    this.onError(err)
  }

  // DEPRECATED - use onReady directly instead
  emitReady() {
    this.onReady()
  }

  bufferClear() {
    this.buffer = []
  }

  cacheClear() {
  }

  cacheClearAt(...values) { // eslint-disable-line no-unused-vars
  }
}

function validatePreset(preset) {
  if (typeof preset !== 'object' || preset === null) {
    throw new Error(`Expected 'preset' to be an 'object'`)
  }
  if (typeof preset.name !== 'string' && preset.name !== null) {
    throw new Error(`Expected the 'name' to be either a 'string' or 'null'; found: ${preset.name}`)
  }
  if (!Object.values(BUFFER_TYPE).includes(preset.bufferType)) {
    throw new Error(`Unexpected 'bufferType': ${preset.bufferType}`)
  }
  if (!Object.values(OVERFLOW_ACTION).includes(preset.overflowAction)) {
    throw new Error(`Unexpected 'overflowAction': ${preset.overflowAction}`)
  }
  if (typeof preset.maxBufferSize !== 'number' || preset.maxBufferSize < 1 || preset.maxBufferSize > MAX_ARRAY_SIZE) {
    // It makes no sense to let the maxBufferSize be equal 0. 0-width buffers
    // would have to either swallow data, or emit it right away, bypassing
    // promiseFactories, timers, filters and alike. Swallowing is problematic
    // because the containing pipe relies on onReady callbacks to work
    // correctly.
    throw new Error(`Expected maxBufferSize to be a 'number' greater than 0 and lower than ${ MAX_ARRAY_SIZE + 1 }; found: ${preset.maxBufferSize}`)
  }
  if (preset.squashDownTo && typeof preset.squashDownTo !== 'function') {
    throw new Error(`Unexpected 'squashDownTo': ${preset.squashDownTo}`)
  }
  // for backwards compatibility the outputChannel is not required
  if (preset.outputChannel &&
      !Object.values(CHANNEL_TYPE).includes(preset.outputChannel)) {
    throw new Error(`Unexpected 'outputChannel' name: ${preset.outputChannel}`)
  }
}

const queue = {
  name: null,
  maxBufferSize: MAX_ARRAY_SIZE,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
  squashDownTo: null,
}

module.exports = {
  BaseValve,
  BUFFER_TYPE,
  CHANNEL_TYPE,
  MAX_ARRAY_SIZE,
  OVERFLOW_ACTION,
  BufferOverflowError,
  BasePresets: {
    queue,
  },
}
