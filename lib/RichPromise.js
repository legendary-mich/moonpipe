'use strict'

const PROMISE_RESOLVE_TYPE = {
  TAP: 'TAP',
  MAP: 'MAP',
}

class TimeoutError extends Error {
  constructor() {
    super('TimeoutError')
  }
}

class RichPromise {

  constructor(promiseFactory, resolveType, timeoutMs) {
    this.promiseFactory = promiseFactory
    this.resolveType = resolveType
    this.timeoutMs = timeoutMs
    this.isCanceled = false
  }

  cancel() {
    this.isCanceled = true
  }

  async run(value, repeatCounter) {
    return new Promise(async (_resolve, _reject) => {
      let isComplete = false
      let activeTimeout = null

      const cleanup = () => {
        isComplete = true
        clearTimeout(activeTimeout)
      }

      const resolve = (result) => {
        if (isComplete) return
        cleanup()
        if (!this.isCanceled) {
          _resolve(result)
        }
      }

      const reject = (error) => {
        if (isComplete) return
        cleanup()
        if (!this.isCanceled) {
          if (repeatCounter > 0) {
            _resolve(this.run(value, --repeatCounter))
          }
          else {
            _reject(error)
          }
        }
      }

      if (this.timeoutMs) {
        activeTimeout = setTimeout(() => {
          reject(new TimeoutError())
        }, this.timeoutMs)
      }

      try {
        const result = await this.promiseFactory(value)
        if (this.resolveType === PROMISE_RESOLVE_TYPE.MAP) {
          resolve(result)
        }
        else if (this.resolveType === PROMISE_RESOLVE_TYPE.TAP) {
          resolve(value)
        }
        else {
          throw new Error(`Unknown resolveType: ${this.resolveType}`)
        }
      }
      catch(error) {
        reject(error)
      }
    })
  }
}


module.exports = {
  RichPromise,
  PROMISE_RESOLVE_TYPE,
  TimeoutError,
}
