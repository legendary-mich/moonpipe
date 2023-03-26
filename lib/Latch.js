'use strict'

class Latch {
  constructor() {
    this.state = 0
  }

  tryUp() {
    if (this.state === 0) {
      this.state = 1
      return true
    }
    return false
  }

  tryDown() {
    if (this.state === 1) {
      this.state = 0
      return true
    }
    return false
  }
}

module.exports = {
  Latch,
}
