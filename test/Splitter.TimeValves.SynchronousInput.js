'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

class Test {
  constructor(poolSize, classifyFn) {
    expect(poolSize).to.be.a('number')
    expect(classifyFn).to.be.a('function')
    this.classify = classifyFn
    this.poolSize = poolSize

  }
  async testInput(method, expected) {
    const results = []
    const mp = new MoonPipe()
      .onBusyTap(value => results.push('on_busy_' + value))
      .splitBy(this.poolSize, this.classify
      )[method](10)
      .join()
      .queueTap(value => {
        results.push('res_' + value)
      })
      .queueError(err => {
        results.push(err)
      })
      .onIdle(() => results.push('on_idle'))

    mp.pump(1)
    mp.pump(2)
    mp.pump(3)
    mp.pump(4)
    await delayPromise(5)
    expect(results).to.eql(expected[0])
    await delayPromise(10)
    expect(results).to.eql(expected[1])
    await delayPromise(10)
    expect(results).to.eql(expected[2])
    await delayPromise(10)
    expect(results).to.eql(expected[3])
    await delayPromise(10)
    expect(results).to.eql(expected[4])
  }
}

describe('Splitter.TimeValves with Synchronous input.', () => {

  describe('poolSize = 1, classify % 1', () => {
    const test = new Test(1, val => val % 1)

    it('queueEager', () => {
      return test.testInput('queueEager', [
        ['on_busy_1', 'res_1'],
        ['on_busy_1', 'res_1', 'res_2'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4', 'on_idle'],
      ])
    })

    it('queueLazy', () => {
      return test.testInput('queueLazy', [
        ['on_busy_1' ],
        ['on_busy_1', 'res_1'],
        ['on_busy_1', 'res_1', 'res_2'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4', 'on_idle'],
      ])
    })

    it('cancelEager', () => {
      return test.testInput('cancelEager', [
        ['on_busy_1', 'res_1'],
        ['on_busy_1', 'res_1', 'res_4'],
        ['on_busy_1', 'res_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_4', 'on_idle'],
      ])
    })

    it('cancelLazy', () => {
      return test.testInput('cancelLazy', [
        ['on_busy_1'],
        ['on_busy_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_4', 'on_idle'],
      ])
    })

    it('throttleEager', () => {
      return test.testInput('throttleEager', [
        ['on_busy_1', 'res_1'],
        ['on_busy_1', 'res_1', 'res_4'],
        ['on_busy_1', 'res_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_4', 'on_idle'],
      ])
    })

    it('throttleLazy', () => {
      return test.testInput('throttleLazy', [
        ['on_busy_1'],
        ['on_busy_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_4', 'on_idle'],
      ])
    })

    it('skipEager', () => {
      return test.testInput('skipEager', [
        ['on_busy_1', 'res_1'],
        ['on_busy_1', 'res_1', 'on_idle'],
        ['on_busy_1', 'res_1', 'on_idle'],
        ['on_busy_1', 'res_1', 'on_idle'],
        ['on_busy_1', 'res_1', 'on_idle'],
      ])
    })

    it('skipLazy', () => {
      return test.testInput('skipLazy', [
        ['on_busy_1'],
        ['on_busy_1', 'res_1', 'on_idle'],
        ['on_busy_1', 'res_1', 'on_idle'],
        ['on_busy_1', 'res_1', 'on_idle'],
        ['on_busy_1', 'res_1', 'on_idle'],
      ])
    })
  })

  describe('poolSize = 1, classify % 2', () => {
    const test = new Test(1, val => val % 2)

    it('queueEager', () => {
      return test.testInput('queueEager', [
        ['on_busy_1', 'res_1'],
        ['on_busy_1', 'res_1', 'res_3'],
        ['on_busy_1', 'res_1', 'res_3', 'res_2'],
        ['on_busy_1', 'res_1', 'res_3', 'res_2', 'res_4'],
        ['on_busy_1', 'res_1', 'res_3', 'res_2', 'res_4', 'on_idle'],
      ])
    })

    it('queueLazy', () => {
      return test.testInput('queueLazy', [
        ['on_busy_1' ],
        ['on_busy_1', 'res_1'],
        ['on_busy_1', 'res_1', 'res_3'],
        ['on_busy_1', 'res_1', 'res_3', 'res_2'],
        ['on_busy_1', 'res_1', 'res_3', 'res_2', 'res_4', 'on_idle'],
      ])
    })

    it('cancelEager', () => {
      return test.testInput('cancelEager', [
        ['on_busy_1', 'res_1'],
        ['on_busy_1', 'res_1', 'res_3'],
        ['on_busy_1', 'res_1', 'res_3', 'res_2'],
        ['on_busy_1', 'res_1', 'res_3', 'res_2', 'res_4'],
        ['on_busy_1', 'res_1', 'res_3', 'res_2', 'res_4', 'on_idle'],
      ])
    })

    it('cancelLazy', () => {
      return test.testInput('cancelLazy', [
        ['on_busy_1'],
        ['on_busy_1', 'res_3'],
        ['on_busy_1', 'res_3', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_3', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_3', 'res_4', 'on_idle'],
      ])
    })

    it('throttleEager', () => {
      return test.testInput('throttleEager', [
        ['on_busy_1', 'res_1'],
        ['on_busy_1', 'res_1', 'res_3'],
        ['on_busy_1', 'res_1', 'res_3', 'res_2'],
        ['on_busy_1', 'res_1', 'res_3', 'res_2', 'res_4'],
        ['on_busy_1', 'res_1', 'res_3', 'res_2', 'res_4', 'on_idle'],
      ])
    })

    it('throttleLazy', () => {
      return test.testInput('throttleLazy', [
        ['on_busy_1'],
        ['on_busy_1', 'res_3'],
        ['on_busy_1', 'res_3', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_3', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_3', 'res_4', 'on_idle'],
      ])
    })

    it('skipEager', () => {
      return test.testInput('skipEager', [
        ['on_busy_1', 'res_1'],
        ['on_busy_1', 'res_1', 'res_2'],
        ['on_busy_1', 'res_1', 'res_2', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_2', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_2', 'on_idle'],
      ])
    })

    it('skipLazy', () => {
      return test.testInput('skipLazy', [
        ['on_busy_1'],
        ['on_busy_1', 'res_1'],
        ['on_busy_1', 'res_1', 'res_2', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_2', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_2', 'on_idle'],
      ])
    })
  })

  describe('poolSize = 2, classify % 1', () => {
    const test = new Test(2, val => val % 1)

    it('queueEager', () => {
      return test.testInput('queueEager', [
        ['on_busy_1', 'res_1'],
        ['on_busy_1', 'res_1', 'res_2'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4', 'on_idle'],
      ])
    })

    it('queueLazy', () => {
      return test.testInput('queueLazy', [
        ['on_busy_1' ],
        ['on_busy_1', 'res_1'],
        ['on_busy_1', 'res_1', 'res_2'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4', 'on_idle'],
      ])
    })

    it('cancelEager', () => {
      return test.testInput('cancelEager', [
        ['on_busy_1', 'res_1'],
        ['on_busy_1', 'res_1', 'res_4'],
        ['on_busy_1', 'res_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_4', 'on_idle'],
      ])
    })

    it('cancelLazy', () => {
      return test.testInput('cancelLazy', [
        ['on_busy_1'],
        ['on_busy_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_4', 'on_idle'],
      ])
    })

    it('throttleEager', () => {
      return test.testInput('throttleEager', [
        ['on_busy_1', 'res_1'],
        ['on_busy_1', 'res_1', 'res_4'],
        ['on_busy_1', 'res_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_4', 'on_idle'],
      ])
    })

    it('throttleLazy', () => {
      return test.testInput('throttleLazy', [
        ['on_busy_1'],
        ['on_busy_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_4', 'on_idle'],
      ])
    })

    it('skipEager', () => {
      return test.testInput('skipEager', [
        ['on_busy_1', 'res_1'],
        ['on_busy_1', 'res_1', 'on_idle'],
        ['on_busy_1', 'res_1', 'on_idle'],
        ['on_busy_1', 'res_1', 'on_idle'],
        ['on_busy_1', 'res_1', 'on_idle'],
      ])
    })

    it('skipLazy', () => {
      return test.testInput('skipLazy', [
        ['on_busy_1'],
        ['on_busy_1', 'res_1', 'on_idle'],
        ['on_busy_1', 'res_1', 'on_idle'],
        ['on_busy_1', 'res_1', 'on_idle'],
        ['on_busy_1', 'res_1', 'on_idle'],
      ])
    })
  })

  describe('poolSize = 2, classify % 2', () => {
    const test = new Test(2, val => val % 2)

    it('queueEager', () => {
      return test.testInput('queueEager', [
        ['on_busy_1', 'res_1', 'res_2'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4', 'on_idle'],
      ])
    })

    it('queueLazy', () => {
      return test.testInput('queueLazy', [
        ['on_busy_1' ],
        ['on_busy_1', 'res_1', 'res_2'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4', 'on_idle'],
      ])
    })

    it('cancelEager', () => {
      return test.testInput('cancelEager', [
        ['on_busy_1', 'res_1', 'res_2'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4', 'on_idle'],
      ])
    })

    it('cancelLazy', () => {
      return test.testInput('cancelLazy', [
        ['on_busy_1'],
        ['on_busy_1', 'res_3', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_3', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_3', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_3', 'res_4', 'on_idle'],
      ])
    })

    it('throttleEager', () => {
      return test.testInput('throttleEager', [
        ['on_busy_1', 'res_1', 'res_2'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_2', 'res_3', 'res_4', 'on_idle'],
      ])
    })

    it('throttleLazy', () => {
      return test.testInput('throttleLazy', [
        ['on_busy_1'],
        ['on_busy_1', 'res_3', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_3', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_3', 'res_4', 'on_idle'],
        ['on_busy_1', 'res_3', 'res_4', 'on_idle'],
      ])
    })

    it('skipEager', () => {
      return test.testInput('skipEager', [
        ['on_busy_1', 'res_1', 'res_2'],
        ['on_busy_1', 'res_1', 'res_2', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_2', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_2', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_2', 'on_idle'],
      ])
    })

    it('skipLazy', () => {
      return test.testInput('skipLazy', [
        ['on_busy_1'],
        ['on_busy_1', 'res_1', 'res_2', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_2', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_2', 'on_idle'],
        ['on_busy_1', 'res_1', 'res_2', 'on_idle'],
      ])
    })
  })
})
