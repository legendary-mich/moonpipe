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

class PromiseContext {
  constructor() {
    this._onCancel = () => {}
  }

  get onCancel() {
    return this._onCancel
  }

  set onCancel(value) {
    if (typeof value !== 'function') {
      throw new Error(`Expected 'onCancel' to be a 'function'`)
    }
    this._onCancel = value
  }
}

class RichPromise {

  constructor(preset, promiseFactory) {
    this.promiseFactory = promiseFactory
    this.resolveType = preset.resolveType
    this.timeoutMs = preset.timeoutMs
    this.repeatPredicate = preset.repeatPredicate
    this.isCanceled = false
    this.publicContext = new PromiseContext()
  }

  cancel() {
    this.isCanceled = true
    try {
      this.publicContext.onCancel()
    }
    catch (err) {
      // Users are supposed to handle all the errors in the onCancel callback.
    }
  }

  async run(value, attemptsMade = 0) {
    return new Promise(async (finalResolve, finalReject) => {
      let isComplete = false
      let activeTimeout = null

      const resolveIfNotCanceled = (result) => {
        if (this.isCanceled) return
        finalResolve(result)
      }

      const rejectIfNotCanceled = (error) => {
        if (this.isCanceled) return
        finalReject(error)
      }

      const cleanup = () => {
        isComplete = true
        clearTimeout(activeTimeout)
      }

      const resolve = (result) => {
        if (isComplete) return
        cleanup()
        resolveIfNotCanceled(result)
      }

      const reject = async (error) => {
        if (isComplete) return
        cleanup()
        if (this.isCanceled) return
        try {
          // The repeatPredicate used to by async. In that case the
          // activeTimeout wouldn't apply to it. If the
          // repeatPredicate promise hanged, the whole RichPromise
          // would be hanging. Because of that I made it synchronous
          // and don't await for it anymore.
          if (this.repeatPredicate(attemptsMade + 1, error)) {
            resolveIfNotCanceled(this.run(value, attemptsMade + 1))
          }
          else {
            rejectIfNotCanceled(error)
          }
        }
        catch(err) {
          // NOTE: The repeatPredicate does not apply to itself. If it
          // throws, the promise will be rejected regardless of the
          // condition in the predicate.
          rejectIfNotCanceled(err)
        }
      }

      if (this.timeoutMs) {
        activeTimeout = setTimeout(() => {
          reject(new TimeoutError())
        }, this.timeoutMs)
      }

      try {
        const result = await this.promiseFactory(value, this.publicContext)
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
