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

  constructor(promiseFactory, resolveType, timeoutMs, repeatPredicate) {
    this.promiseFactory = promiseFactory
    this.resolveType = resolveType
    this.timeoutMs = timeoutMs
    this.isCanceled = false
    this.repeatPredicate = repeatPredicate
  }

  cancel() {
    this.isCanceled = true
  }

  async run(value, attemptsMade = 0) {
    return new Promise(async (__resolve, __reject) => {
      let isComplete = false
      let activeTimeout = null

      const _resolve = (result) => {
        if (this.isCanceled) return
        __resolve(result)
      }

      const _reject = (error) => {
        if (this.isCanceled) return
        __reject(error)
      }

      const cleanup = () => {
        isComplete = true
        clearTimeout(activeTimeout)
      }

      const resolve = (result) => {
        if (isComplete) return
        cleanup()
        _resolve(result)
      }

      const reject = async (error) => {
        if (isComplete) return
        cleanup()
        if (this.isCanceled) return
        try {
          // NOTE: The activeTimeout does not apply to the
          // repeatPredicate. If the repeatPredicate promise hangs,
          // The whole promise will be hanging until you cancel it.
          if (await this.repeatPredicate(attemptsMade + 1, error)) {
            _resolve(this.run(value, attemptsMade + 1))
          }
          else {
            _reject(error)
          }
        }
        catch(err) {
          // NOTE: The repeatPredicate does not apply to itself. If it
          // throws, the promise will be rejected regardless of the
          // condition in the predicate.
          _reject(err)
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
