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
      .onBusy(() => results.push('on_busy'))
      .splitBy(this.poolSize, this.classify
      )[method](async value => {
        await delayPromise(1)
        return value + 100
      })
      .join()
      .queueTap(value => {
        results.push('res_' + value)
      })
      .queueError(err => {
        results.push(err)
      })
      .onIdle(() => results.push('on_idle'))

    mp.pump(1)
    await Promise.resolve()
    mp.pump(2)
    await Promise.resolve()
    mp.pump(3)
    await Promise.resolve()
    mp.pump(4)
    await delayPromise(16)
    expect(results).to.eql(expected)
  }
}

describe('Splitter.PromiseValves with Asynchronous input.', () => {

  describe('poolSize = 1, classify % 1', () => {
    const test = new Test(1, val => val % 1)

    it('queueTap', async () => {
      await test.testInput('queueTap', [
        'on_busy',
        'res_1',
        'res_2',
        'res_3',
        'res_4',
        'on_idle',
      ])
    })

    it('queueMap', async () => {
      await test.testInput('queueMap', [
        'on_busy',
        'res_101',
        'res_102',
        'res_103',
        'res_104',
        'on_idle',
      ])
    })

    it('cancelTap', async () => {
      await test.testInput('cancelTap', [
        'on_busy',
        'res_4',
        'on_idle',
      ])
    })

    it('cancelMap', async () => {
      await test.testInput('cancelMap', [
        'on_busy',
        'res_104',
        'on_idle',
      ])
    })

    it('throttleTap', async () => {
      await test.testInput('throttleTap', [
        'on_busy',
        'res_1',
        'res_4',
        'on_idle',
      ])
    })

    it('throttleMap', async () => {
      await test.testInput('throttleMap', [
        'on_busy',
        'res_101',
        'res_104',
        'on_idle',
      ])
    })

    it('skipTap', async () => {
      await test.testInput('skipTap', [
        'on_busy',
        'res_1',
        'on_idle',
      ])
    })

    it('skipMap', async () => {
      await test.testInput('skipMap', [
        'on_busy',
        'res_101',
        'on_idle',
      ])
    })

  })

  describe('poolSize = 1, classify % 2', () => {
    const test = new Test(1, val => val % 2)

    it('queueTap', async () => {
      await test.testInput('queueTap', [
        'on_busy',
        'res_1',
        'res_3',
        'res_2',
        'res_4',
        'on_idle',
      ])
    })

    it('queueMap', async () => {
      await test.testInput('queueMap', [
        'on_busy',
        'res_101',
        'res_103',
        'res_102',
        'res_104',
        'on_idle',
      ])
    })

    it('cancelTap', async () => {
      await test.testInput('cancelTap', [
        'on_busy',
        'res_3',
        'res_4',
        'on_idle',
      ])
    })

    it('cancelMap', async () => {
      await test.testInput('cancelMap', [
        'on_busy',
        'res_103',
        'res_104',
        'on_idle',
      ])
    })

    it('throttleTap', async () => {
      await test.testInput('throttleTap', [
        'on_busy',
        'res_1',
        'res_3',
        'res_4',
        'on_idle',
      ])
    })

    it('throttleMap', async () => {
      await test.testInput('throttleMap', [
        'on_busy',
        'res_101',
        'res_103',
        'res_104',
        'on_idle',
      ])
    })

    it('skipTap', async () => {
      await test.testInput('skipTap', [
        'on_busy',
        'res_1',
        'res_2',
        'on_idle',
      ])
    })

    it('skipMap', async () => {
      await test.testInput('skipMap', [
        'on_busy',
        'res_101',
        'res_102',
        'on_idle',
      ])
    })

  })

  describe('poolSize = 2, classify % 1', () => {
    const test = new Test(2, val => val % 1)

    it('queueTap', async () => {
      await test.testInput('queueTap', [
        'on_busy',
        'res_1',
        'res_2',
        'res_3',
        'res_4',
        'on_idle',
      ])
    })

    it('queueMap', async () => {
      await test.testInput('queueMap', [
        'on_busy',
        'res_101',
        'res_102',
        'res_103',
        'res_104',
        'on_idle',
      ])
    })

    it('cancelTap', async () => {
      await test.testInput('cancelTap', [
        'on_busy',
        'res_4',
        'on_idle',
      ])
    })

    it('cancelMap', async () => {
      await test.testInput('cancelMap', [
        'on_busy',
        'res_104',
        'on_idle',
      ])
    })

    it('throttleTap', async () => {
      await test.testInput('throttleTap', [
        'on_busy',
        'res_1',
        'res_4',
        'on_idle',
      ])
    })

    it('throttleMap', async () => {
      await test.testInput('throttleMap', [
        'on_busy',
        'res_101',
        'res_104',
        'on_idle',
      ])
    })

    it('skipTap', async () => {
      await test.testInput('skipTap', [
        'on_busy',
        'res_1',
        'on_idle',
      ])
    })

    it('skipMap', async () => {
      await test.testInput('skipMap', [
        'on_busy',
        'res_101',
        'on_idle',
      ])
    })

  })

  describe('poolSize = 2, classify % 2', () => {
    const test = new Test(2, val => val % 2)

    it('queueTap', async () => {
      await test.testInput('queueTap', [
        'on_busy',
        'res_1',
        'res_2',
        'res_3',
        'res_4',
        'on_idle',
      ])
    })

    it('queueMap', async () => {
      await test.testInput('queueMap', [
        'on_busy',
        'res_101',
        'res_102',
        'res_103',
        'res_104',
        'on_idle',
      ])
    })

    it('cancelTap', async () => {
      await test.testInput('cancelTap', [
        'on_busy',
        'res_3',
        'res_4',
        'on_idle',
      ])
    })

    it('cancelMap', async () => {
      await test.testInput('cancelMap', [
        'on_busy',
        'res_103',
        'res_104',
        'on_idle',
      ])
    })

    it('throttleTap', async () => {
      await test.testInput('throttleTap', [
        'on_busy',
        'res_1',
        'res_2',
        'res_3',
        'res_4',
        'on_idle',
      ])
    })

    it('throttleMap', async () => {
      await test.testInput('throttleMap', [
        'on_busy',
        'res_101',
        'res_102',
        'res_103',
        'res_104',
        'on_idle',
      ])
    })

    it('skipTap', async () => {
      await test.testInput('skipTap', [
        'on_busy',
        'res_1',
        'res_2',
        'on_idle',
      ])
    })

    it('skipMap', async () => {
      await test.testInput('skipMap', [
        'on_busy',
        'res_101',
        'res_102',
        'on_idle',
      ])
    })

  })
})
