'use strict'

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
    this.overflowAction = preset.overflowAction

    this.onData = () => {}
    this.onError = () => {}
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
      lastSlice.push(data)
    }
    else {
      if (this.buffer.length >= this.maxBufferSize) {
        switch (this.overflowAction) {
        case OVERFLOW_ACTION.EMIT_ERROR:
          this.onError(new BufferOverflowError())
          return
        case OVERFLOW_ACTION.SKIP:
          return
        case OVERFLOW_ACTION.SHIFT:
          this.buffer.shift()
          break
        default:
          throw new Error(`Unknown overflowAction (${ this.overflowAction })`)
        }
      }
      this.buffer.push(data)
    }
  }

  next() {
    if (this.buffer.length > 0) {
      this.onData(this.pluck())
      this.onReady()
    }
  }

  cacheClear() {
  }

  cacheClearOne(value) {
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
  if (typeof preset.maxBufferSize !== 'number' || preset.maxBufferSize < 1) {
    throw new Error(`Expected maxBufferSize to be a 'number' greater than 0; found: ${preset.maxBufferSize}`)
  }
}

const queue = {
  maxBufferSize: Number.MAX_SAFE_INTEGER,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
}

module.exports = {
  BaseValve,
  BUFFER_TYPE,
  OVERFLOW_ACTION,
  BufferOverflowError,
  BasePresets: {
    queue,
  },
}
