'use strict'

const MAX_ARRAY_SIZE = 2**32-1

const BUFFER_TYPE = {
  QUEUE: 'QUEUE',
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
    this.buffer = []
    this.bufferType = preset.bufferType
    this.maxBufferSize = preset.maxBufferSize
    this.numberOfReservedSlots = 0
    this.overflowAction = preset.overflowAction

    this.onData = () => {}
    this.onError = () => {}
    this.onReady = () => {}
  }

  get numberOfFreeSlots() {
    return this.maxBufferSize - this.numberOfReservedSlots - this.buffer.length
  }

  // DEPRECATED - use isIdle instead
  get isEmpty() {
    return this.isIdle
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
    if (this.overflowAction === OVERFLOW_ACTION.SLICE) {
      let lastSlice = this.buffer[this.buffer.length - 1]
      if (!lastSlice || lastSlice.length >= this.maxBufferSize) {
        lastSlice = []
        this.buffer.push(lastSlice)
      }
      if (this.maxBufferSize > 0) {
        lastSlice.push(data)
      }
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
          // The buffer will be empty (length < 0) when
          // maxBufferSize === 0 OR
          // maxBufferSize === numberOfReservedSlots
          // There will be nothing to shift in either case, but let's
          // imagine a short-lived buffer underflow in the second
          // one.
          if (this.buffer.length > 0) { this.buffer.shift() }
          break
        default:
          throw new Error(`Unknown overflowAction (${ this.overflowAction })`)
        }
      }
      if (this.maxBufferSize > 0) {
        // It is OK to push to the buffer for
        // (numberOfFreeSlots < 1) when (overflowAction === SHIFT).
        // We need it this way because OVERFLOW_ACTION.SHIFT creates a
        // short-lived buffer underflow when there's nothing to shift.
        this.buffer.push(data)
      }
    }
  }

  next() {
    if (this.buffer.length > 0) {
      this.onData(this.pluck())
      this.onReady()
    }
  }

  bufferClear() {
    this.buffer = []
  }

  cacheClear() {
  }

  cacheClearAt(value) { // eslint-disable-line no-unused-vars
  }
}

function validatePreset(preset) {
  if (typeof preset !== 'object' || preset === null) {
    throw new Error(`Expected 'preset' to be an 'object'`)
  }
  if (!Object.values(BUFFER_TYPE).includes(preset.bufferType)) {
    throw new Error(`Unexpected 'bufferType': ${preset.bufferType}`)
  }
  if (!Object.values(OVERFLOW_ACTION).includes(preset.overflowAction)) {
    throw new Error(`Unexpected 'overflowAction': ${preset.overflowAction}`)
  }
  if (typeof preset.maxBufferSize !== 'number' || preset.maxBufferSize < 0 || preset.maxBufferSize > MAX_ARRAY_SIZE) {
    throw new Error(`Expected maxBufferSize to be a 'number' greater than -1 and lower than ${ MAX_ARRAY_SIZE + 1 }; found: ${preset.maxBufferSize}`)
  }
}

const queue = {
  maxBufferSize: MAX_ARRAY_SIZE,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
}

module.exports = {
  BaseValve,
  BUFFER_TYPE,
  MAX_ARRAY_SIZE,
  OVERFLOW_ACTION,
  BufferOverflowError,
  BasePresets: {
    queue,
  },
}
