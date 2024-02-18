'use strict'

class ConstantBackoff {
  constructor(delay) {
    if (typeof delay !== 'number' || delay < 0) {
      throw new Error(`Expected delay to be a 'number' greater or equal to 0; found: ${delay}`)
    }
    this.delay = delay
  }
  nextDelayMs() {
    return this.delay
  }
}

class LinearBackoff {
  constructor(baseDelay) {
    if (typeof baseDelay !== 'number' || baseDelay < 0) {
      throw new Error(`Expected baseDelay to be a 'number' greater or equal to 0; found: ${baseDelay}`)
    }
    this.baseDelay = baseDelay
    this.multiplier = 0
  }
  nextDelayMs() {
    ++this.multiplier
    return this.baseDelay * this.multiplier
  }
}

module.exports = {
  ConstantBackoff,
  LinearBackoff,
}
