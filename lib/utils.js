'use strict'

module.exports = {
  delayPromise(ms) {
    return new Promise(resolve => {
      setTimeout(() => { resolve() }, ms)
    })
  },
}
