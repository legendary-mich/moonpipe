'use strict'

module.exports = {
  /**
   * @param {number} ms
   * @returns {Promise<void>}
   */
  delayPromise(ms) {
    return new Promise(resolve => {
      setTimeout(() => { resolve() }, ms)
    })
  },
}
