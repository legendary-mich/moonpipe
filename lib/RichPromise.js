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
    this.attemptsMade = 0
  }

  cancel() {
    this.isCanceled = true
    clearTimeout(this.activeTimeout)
    this.publicContext._runOnCancel()
  }

  async getTimeoutPromise() {
    if (!this.timeoutMs) {
      return new Promise(() => {})
    }
    return new Promise((resolve, reject) => {
      this.activeTimeout = setTimeout(() => {
        try {
          this.publicContext._runOnCancel()
          reject(new TimeoutError())
        }
        catch (err) {
          reject(err)
        }
      }, this.timeoutMs)
    })
  }

  async runOnce(value) {
    return new Promise(async (resolve, reject) => { // eslint-disable-line no-async-promise-executor
      try {
        if (this.isCanceled) return
        ++this.attemptsMade
        this.publicContext = new PromiseContext()
        const result = await Promise.race([
          this.getTimeoutPromise(),
          this.promiseFactory(value, this.publicContext),
        ])
        if (this.isCanceled) return
        resolve (result)
      }
      catch (err) {
        if (this.isCanceled) return
        reject(err)
      }
      finally {
        clearTimeout(this.activeTimeout)
      }
    })
  }

  shouldRepeat(err) {
    // The repeatPredicate used to by asynchronous. I made it synchronous
    // because it runs outside of the activeTimeout context, meaning that if it
    // hanged, the whole promise would be hanging.
    return this.repeatPredicate(this.attemptsMade, err)
  }

  async repeatDelay() {
    const delay = this.repeatBackoff.nextDelayMs()
    await new Promise((repeatResolve) => {
      setTimeout(repeatResolve, delay)
    })
  }

  async run(value) {
    while (true) { // eslint-disable-line no-constant-condition
      try {
        return await this.runOnce(value)
      }
      catch (err) {
        const shouldRepeat = this.shouldRepeat(err)
        if (!shouldRepeat) throw err
        await this.repeatDelay()
      }
    }
  }
}


module.exports = {
  RichPromise,
  TimeoutError,
  PromiseContext,
}
