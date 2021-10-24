'use strict'

const { BaseValve } = require('./BaseValve.js')

class FlattenValve extends BaseValve {

  constructor(preset) {
    super(preset)
  }

  next() {
    if (this.buffer.length < 1) { return }
    const arr = this.pluck()
    if (!Array.isArray(arr)) {
      this.onError(new Error(`Expected an array; found: ${typeof arr}`))
      return
    }
    for (const val of arr) {
      this.onData(val)
    }
    this.onReady()
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

  next() {
    if (this.buffer.length < 1) { return }
    const val = this.pluck()
    try {
      this.onData(this.transformFunc(val))
    }
    catch (err) {
      this.onError(err)
    }
    this.onReady()
  }
}

class FilterValve extends BaseValve {

  constructor(preset, transformFunc) {
    super(preset)
    if (typeof transformFunc !== 'function') {
      throw new Error(
        `Expected transformFunc to be a function; found: ${ typeof transformFunc }`
      )
    }
    this.transformFunc = transformFunc
  }

  next() {
    if (this.buffer.length < 1) { return }
    const val = this.pluck()
    try {
      if (this.transformFunc(val)) {
        this.onData(val)
      }
    }
    catch (err) {
      this.onError(err)
    }
    this.onReady()
  }
}

module.exports = {
  FlattenValve,
  MapValve,
  FilterValve,
}
