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

    this.onData = () => {}
    this.onError = () => {}
    this.onReady = () => {}

    this.poolSize = preset.poolSize
    this.mpPool = []
    this.allPipes = []
    this.activePipes = {}
    this.dataBuckets = {}
    for (let i = 0; i < this.poolSize; ++i) {
      const mp = new MoonPipe()
      mp.onIdle(() => this.cleanUp(mp))
      mp.onData(data => this.onData(data))
      mp.onError(error => this.onError(error))
      this.mpPool.push(mp)
      this.allPipes.push(mp)
    }
  }

  clone() {
    return new Splitter(this.preset, this.classify)
  }

  get hasName() {
    return typeof this.name === 'string'
  }

  pipe(valve, channel) {
    if (this.mpPool.length !== this.poolSize) {
      throw new Error('Piping to a busy Splitter is forbidden')
    }
    for (const mp of this.mpPool) {
      const v = valve.clone()
      if (valve instanceof PromiseValve) {
        // Need to share the cache for the sibling valves within the
        // same pool, because it may happen that a pipe is assigned to
        // a key that previously another pipe was assigned to.
        v.cache = valve.cache
      }
      mp.pipe(v, channel)
    }
    return this
  }

  join() {
    if (this.mpPool.length !== this.poolSize) {
      throw new Error('Joining a busy Splitter is forbidden')
    }
    for (const mp of this.mpPool) {
      mp.join()
    }
  }

  get isIdle() {
    return this.mpPool.length === this.poolSize &&
      Object.keys(this.dataBuckets).length === 0
    // There are only idle pipes in mpPool, so there's no need to
    // check for the isIdle property here.
    // && this.mpPool.every(mp => mp.isIdle())
  }

  push(data) {
    try {
      // The classify function can throw.
      const bucketName = this.classify(data)
      let bucket = this.dataBuckets[bucketName]
      if (!bucket) {
        bucket = this.dataBuckets[bucketName] = []
      }
      bucket.push(data)
    }
    catch(err) {
      this.onError(err)
    }
  }

  next() {
    const keys = Object.keys(this.dataBuckets)
    const jobs = keys.map(k => {
      let mp = this.activePipes[k]
      if (!mp && this.mpPool.length > 0) {
        mp = this.activePipes[k] = this.mpPool.pop()
      }
      return mp ? { key: k, bucket: this.dataBuckets[k], mp } : null
    }).filter(j => !!j)

    jobs.forEach(j => { delete this.dataBuckets[j.key] })
    jobs.forEach(j => {
      for (const data of j.bucket) {
        j.mp.pump(data)
      }
    })
  }

  cleanUp(mp) {
    const keys = Object.keys(this.activePipes)
    for (const k of keys) {
      const activeMp = this.activePipes[k]
      if (mp === activeMp) {
        this.mpPool.push(mp)
        delete this.activePipes[k]
      }
    }
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
