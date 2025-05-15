'use strict'

const { ConstantBackoff } = require('./Backoff.js')

class TimeoutError extends Error {
  constructor() {
    super('TimeoutError')
  }
}

class PromiseContext {
  constructor() {
    this._onCancel = () => {}
    this._hasOnCancelAlreadyRun = false
  }

  /**
   * @returns {function(): void}
   */
  get onCancel() {
    return this._onCancel
  }

  /**
   * @param {function(): void} callback
   * @returns void
   */
  set onCancel(callback) {
    if (typeof callback !== 'function') {
      throw new Error(`Expected 'onCancel' to be a 'function'`)
    }
    this._onCancel = callback
  }

  /**
   * For INTERNAL use only.
   */
  _runOnCancel() {
    if (this._hasOnCancelAlreadyRun) return
    this._hasOnCancelAlreadyRun = true
    this.onCancel()
  }
}

class RichPromise {

  constructor(preset, promiseFactory) {
    this.promiseFactory = promiseFactory
    this.timeoutMs = preset.timeoutMs
    this.repeatPredicate = preset.repeatPredicate
    this.repeatBackoff = preset.repeatBackoffFactory &&
      preset.repeatBackoffFactory() || new ConstantBackoff(0)
    this.isCanceled = false
    this.activeTimeout = null
    this.publicContext = new PromiseContext()
  }

  cancel() {
    this.isCanceled = true
    clearTimeout(this.activeTimeout)
    this.publicContext._runOnCancel()
  }

  async run(value, attemptsMade = 0) {
    return new Promise(async (finalResolve, finalReject) => {
      if (this.isCanceled) return
      let isComplete = false

      const rejectIfNotCanceled = (error) => {
        if (this.isCanceled) return
        finalReject(error)
      }

      const cleanup = () => {
        isComplete = true
        clearTimeout(this.activeTimeout)
      }

      const resolve = (result) => {
        if (isComplete) return
        cleanup()
        if (this.isCanceled) return
        finalResolve(result)
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
            setTimeout(() => {
              finalResolve(this.run(value, attemptsMade + 1))
            }, this.repeatBackoff.nextDelayMs())
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

      clearTimeout(this.activeTimeout)
      if (this.timeoutMs) {
        this.activeTimeout = setTimeout(() => {
          try {
            this.publicContext._runOnCancel()
            reject(new TimeoutError())
          }
          catch (err) {
            reject(err)
          }
        }, this.timeoutMs)
      }

      try {
        this.publicContext = new PromiseContext()
        const result = await this.promiseFactory(value, this.publicContext)
        resolve(result)
      }
      catch(error) {
        reject(error)
      }
    })
  }
}


module.exports = {
  RichPromise,
  TimeoutError,
  PromiseContext,
}
