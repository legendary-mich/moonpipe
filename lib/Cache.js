'use strict'

class Cache {
  constructor(preset) {
    this.enabled = preset.cache
    this.hashFunction = preset.hashFunction
    this.results = new Map()
    this.cleanupActions = []
  }

  has(value) {
    return this.results.has(this.hashFunction(value))
  }

  get(value) {
    return this.results.get(this.hashFunction(value))
  }

  set(value, result) {
    this.results.set(this.hashFunction(value), result)
  }

  shouldCleanUp() {
    return this.cleanupActions.length > 0
  }

  cleanUp() {
    const actions =  this.cleanupActions
    this.cleanupActions = []
    for (const action of actions) {
      action()
    }
  }

  clearAt(...values) {
    this.cleanupActions.push(() => {
      for (const value of values) {
        this.results.delete(this.hashFunction(value))
      }
    })
  }

  clear() {
    this.cleanupActions.push(() => {
      this.results.clear()
    })
  }

  clearByResult(predicateFunc) {
    if (typeof predicateFunc !== 'function') {
      throw new Error(`Unexpected 'predicateFunc': ${predicateFunc}`)
    }
    this.cleanupActions.push(() => {
      this.results.forEach((result, key) => {
        if (predicateFunc(result, key)) {
          this.results.delete(key)
        }
      })
    })
  }

  updateByResult(transformFunc) {
    if (typeof transformFunc !== 'function') {
      throw new Error(`Unexpected 'transformFunc': ${transformFunc}`)
    }
    this.cleanupActions.push(() => {
      this.results.forEach((result, key) => {
        const newResult = transformFunc(result, key)
        this.results.set(key, newResult)
      })
    })
  }
}

module.exports = {
  Cache,
}
