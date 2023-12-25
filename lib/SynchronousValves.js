'use strict'

const {
  BaseValve,
  BUFFER_TYPE,
  CHANNEL_TYPE,
  MAX_ARRAY_SIZE,
  OVERFLOW_ACTION,
} = require('./BaseValve.js')

class FlattenValve extends BaseValve {

  constructor(preset) {
    super(preset)
  }

  clone() {
    return new FlattenValve(this.preset)
  }

  next() {
    if (this.buffer.length < 1) { return }
    const arr = this.pluck()
    if (!Array.isArray(arr)) {
      this.emitErr(new Error(`Expected an array; found: ${typeof arr}`))
      return
    }
    for (const val of arr) {
      this.emitOut(val)
    }
    this.emitReady()
  }
}

class MapValve extends BaseValve {

  constructor(preset, transformFunc) {
    super(preset)
    if (typeof transformFunc !== 'function') {
      throw new Error(
        `Expected transformFunc to be a function; found: ${ typeof transformFunc }`
      )
    }
    this.transformFunc = transformFunc
  }

  clone() {
    return new MapValve(this.preset, this.transformFunc)
  }

  next() {
    if (this.buffer.length < 1) { return }
    const val = this.pluck()
    try {
      this.emitOut(this.transformFunc(val))
    }
    catch (err) {
      this.emitErr(err)
    }
    this.emitReady()
  }
}

class FilterValve extends BaseValve {

  constructor(preset, predicateFunc) {
    super(preset)
    if (typeof predicateFunc !== 'function') {
      throw new Error(
        `Expected predicateFunc to be a function; found: ${ typeof predicateFunc }`
      )
    }
    this.predicateFunc = predicateFunc
  }

  clone() {
    return new FilterValve(this.preset, this.predicateFunc)
  }

  next() {
    if (this.buffer.length < 1) { return }
    const val = this.pluck()
    try {
      if (this.predicateFunc(val)) {
        this.emitOut(val)
      }
    }
    catch (err) {
      this.emitErr(err)
    }
    this.emitReady()
  }
}

const dataOut = {
  name: null,
  maxBufferSize: MAX_ARRAY_SIZE,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
  outputChannel: CHANNEL_TYPE.DATA,
}

const errorOut = Object.assign({}, dataOut, {
  outputChannel: CHANNEL_TYPE.ERROR,
})

module.exports = {
  FlattenValve,
  MapValve,
  FilterValve,
  SynchronousPresets: {
    dataOut,
    errorOut,
  },
}
