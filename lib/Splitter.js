'use strict'

const { MoonPipe } = require('./MoonPipe.js')
const { PromiseValve } = require('./PromiseValve.js')

class Splitter {

  constructor(preset, classifyFn) {
    if (typeof preset !== 'object' || preset === null) {
      throw new Error(`Expected 'preset' to be an 'object'`)
    }
    if (typeof preset.name !== 'string' && preset.name !== null) {
      throw new Error(`Expected the 'name' to be either a 'string' or 'null'; found: ${preset.name}`)
    }
    if (typeof preset.poolSize !== 'number' || preset.poolSize < 1) {
      throw new Error(`Expected poolSize to be a 'number' greater or equal to 1; found: ${preset.poolSize}`)
    }
    if (typeof classifyFn !== 'function') {
      throw new Error(`Unexpected 'classifyFn': ${classifyFn}`)
    }

    this.classify = classifyFn
    this.name = preset.name
    this.preset = preset

    this.onData = (data) => {} // eslint-disable-line no-unused-vars
    this.onError = (err) => {} // eslint-disable-line no-unused-vars
    this.onReady = () => {}

    this.poolSize = preset.poolSize
    this.idlePipes = []
    this.allPipes = []
    this.activePipes = new Map()
    this.dataBuckets = new Map()
    for (let i = 0; i < this.poolSize; ++i) {
      const mp = new MoonPipe()
      mp.onIdle(() => this.cleanUp(mp))
      mp.onData(data => this.onData(data))
      mp.onError(error => this.onError(error))
      this.idlePipes.push(mp)
      this.allPipes.push(mp)
    }

    this.hooks = {
      onBusyBy: null,
      onIdleBy: null,
    }
  }

  clone() {
    const clone = new Splitter(this.preset, this.classify)
    clone.hooks = this.hooks
    return clone
  }

  get hasName() {
    return typeof this.name === 'string'
  }

  pipe(valve, inputChannel, outputChannel) {
    for (const mp of this.allPipes) {
      const v = valve.clone()
      mp.pipe(v, inputChannel, outputChannel)
    }
    return this
  }

  join() {
    for (const mp of this.allPipes) {
      mp.join()
    }
  }

  get isIdle() {
    return this.idlePipes.length === this.poolSize &&
      this.dataBuckets.size === 0
  }

  push(data) {
    try {
      // The classify function and the onBusyBy hook can throw.
      const bucketName = this.classify(data)
      let bucket = this.dataBuckets.get(bucketName)
      if (!bucket) {
        bucket = []
        this.dataBuckets.set(bucketName, bucket)
        this.hooks.onBusyBy?.(bucketName)
      }
      bucket.push(data)
    }
    catch(err) {
      this.onError(err)
    }
  }

  next() {
    this.dataBuckets.forEach((bucket, key) => {
      let mp = this.activePipes.get(key)
      if (!mp && this.idlePipes.length > 0) {
        mp = this.idlePipes.pop()
        this.activePipes.set(key, mp)
      }
      if (mp) {
        this.dataBuckets.set(key, [])
        for (const data of bucket) {
          mp.pump(data)
        }
      }
    })
  }

  cleanUp(mp) {
    this.activePipes.forEach((activeMp, key) => {
      if (mp === activeMp) {
        this.idlePipes.push(mp)
        this.activePipes.delete(key)
        if (this.dataBuckets.get(key).length === 0) {
          this.dataBuckets.delete(key)
          try {
            this.hooks.onIdleBy?.(key)
          }
          catch (err) {
            this.onError(err)
          }
        }
      }
    })
    this.onReady()
  }

  bufferClear() {
    for (const mp of this.allPipes) {
      mp.buffersClearAll()
    }
  }

  buffersClearOne(valveName) {
    for (const mp of this.allPipes) {
      mp.buffersClearOne(valveName)
    }
  }

  cacheClear() {
    for (const mp of this.allPipes) {
      mp.cacheClearAll()
    }
  }

  cacheClearOne(valveName, ...values) {
    for (const mp of this.allPipes) {
      mp.cacheClearOne(valveName, ...values)
    }
  }

  cacheClearByResult(valveName, predicateFunc) {
    for (const mp of this.allPipes) {
      mp.cacheClearByResult(valveName, predicateFunc)
    }
  }

  cacheUpdateByResult(valveName, transformFunc) {
    for (const mp of this.allPipes) {
      mp.cacheUpdateByResult(valveName, transformFunc)
    }
  }

  cachePopulate(valveName, value, result) {
    for (const mp of this.allPipes) {
      mp.cachePopulate(valveName, value, result)
    }
  }
}

module.exports = {
  Splitter,
  SplitterPresets: {
    basic: {
      name: null,
      poolSize: 2,
    },
  },
}
