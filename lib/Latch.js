'use strict'

class Latch {
  constructor() {
    this.isUp = false
  }

  tryUp() {
    if (this.isUp === false) {
      this.isUp = true
      return true
    }
    return false
  }

  tryDown() {
    if (this.isUp === true) {
      this.isUp = false
      return true
    }
    return false
  }
}

module.exports = {
  Latch,
}
