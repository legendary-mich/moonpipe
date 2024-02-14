'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

describe('PromiseValves.Buffers.Clear.All.js', () => {

  describe('MoonPipe.queue', () => {

    async function testInput(method, expected) {
      const results = []
      const pipe = new MoonPipe()[method](async (value) => {
        results.push('a_' + value)
        await delayPromise(2)
        return value + '_mapped'
      })
        .queueTap(async (value) => {
          results.push('b_' + value)
          await delayPromise(2)
        })
        .onBusy(() => {
          results.push('on_busy')
        })
        .onIdle(() => {
          results.push('on_idle')
        })

      pipe.pump(1)
      pipe.pump(20)
      pipe.pump(300)

      await delayPromise(4)
      pipe.buffersClearAll()

      pipe.pump(4000)

      await delayPromise(20)
      expect(results).to.eql(expected)
    }

    describe('Tap', () => {
      it('pumps ORIGINAL values', () => {
        return testInput('queueTap', [
          'on_busy',
          'a_1',
          'b_1',
          'a_20',
          'on_idle',
          'on_busy',
          'a_4000',
          'b_4000',
          'on_idle',
        ])
      })
    })

    describe('Map', () => {
      it('pumps MODIFIED values', () => {
        return testInput('queueMap', [
          'on_busy',
          'a_1',
          'b_1_mapped',
          'a_20',
          'on_idle',
          'on_busy',
          'a_4000',
          'b_4000_mapped',
          'on_idle',
        ])
      })
    })
  })

  describe('MoonPipe.cancel', () => {

    async function testInput(method, expected) {
      const results = []
      const pipe = new MoonPipe()[method](async (value) => {
        results.push('a_' + value)
        await delayPromise(2)
        return value + '_mapped'
      })
        .queueTap(async (value) => {
          results.push('b_' + value)
          await delayPromise(2)
        })
        .onBusy(() => {
          results.push('on_busy')
        })
        .onIdle(() => {
          results.push('on_idle')
        })

      pipe.pump(1)
      await delayPromise(1)
      pipe.buffersClearAll()
      await delayPromise(2)

      pipe.pump(4000)

      await delayPromise(10)
      expect(results).to.eql(expected)
    }

    describe('Tap', () => {
      it('cancels initial promises, and resolves the last one with the ORIGINAL value', () => {
        return testInput('cancelTap', [
          'on_busy',
          'a_1',
          'on_idle',
          'on_busy',
          'a_4000',
          'b_4000',
          'on_idle',
        ])
      })
    })

    describe('Map', () => {
      it('cancels initial promises, and resolves the last one with a MODIFIED value', () => {
        return testInput('cancelMap', [
          'on_busy',
          'a_1',
          'on_idle',
          'on_busy',
          'a_4000',
          'b_4000_mapped',
          'on_idle',
        ])
      })
    })
  })

  describe('MoonPipe.throttle', () => {

    async function testInput(method, expected) {
      const results = []
      const pipe = new MoonPipe()[method](async (value) => {
        results.push('a_' + value)
        await delayPromise(2)
        return value + '_mapped'
      })
        .queueTap(async (value) => {
          results.push('b_' + value)
          await delayPromise(2)
        })
        .onBusy(() => {
          results.push('on_busy')
        })
        .onIdle(() => {
          results.push('on_idle')
        })

      pipe.pump(1)
      await delayPromise(1)
      pipe.buffersClearAll()
      await delayPromise(2)

      pipe.pump(4000)

      await delayPromise(10)
      expect(results).to.eql(expected)
    }

    describe('Tap', () => {
      it('removes values which are waiting in the queue, and pumps ORIGINAL ones', () => {
        return testInput('throttleTap', [
          'on_busy',
          'a_1',
          'on_idle',
          'on_busy',
          'a_4000',
          'b_4000',
          'on_idle',
        ])
      })
    })

    describe('Map', () => {
      it('removes values which are waiting in the queue, and pumps MODIFIED ones', () => {
        return testInput('throttleMap', [
          'on_busy',
          'a_1',
          'on_idle',
          'on_busy',
          'a_4000',
          'b_4000_mapped',
          'on_idle',
        ])
      })
    })
  })

  describe('MoonPipe.skip', () => {

    async function testInput(method, expected) {
      const results = []
      const pipe = new MoonPipe()[method](async (value) => {
        results.push('a_' + value)
        await delayPromise(2)
        return value + '_mapped'
      })
        .queueTap(async (value) => {
          results.push('b_' + value)
          await delayPromise(2)
        })
        .onBusy(() => {
          results.push('on_busy')
        })
        .onIdle(() => {
          results.push('on_idle')
        })

      pipe.pump(1)
      await delayPromise(1)
      pipe.buffersClearAll()
      await delayPromise(2)

      pipe.pump(4000)

      await delayPromise(10)
      expect(results).to.eql(expected)
    }

    describe('Tap', () => {
      it('whatever', () => {
        return testInput('skipTap', [
          'on_busy',
          'a_1',
          'on_idle',
          'on_busy',
          'a_4000',
          'b_4000',
          'on_idle',
        ])
      })
    })

    describe('Map', () => {
      it('whatever', () => {
        return testInput('skipMap', [
          'on_busy',
          'a_1',
          'on_idle',
          'on_busy',
          'a_4000',
          'b_4000_mapped',
          'on_idle',
        ])
      })
    })
  })

  describe('Error thrown in onCancel', () => {

    async function testInput(method, expected) {
      const results = []
      const pipe = new MoonPipe()[method](async (value, ctx) => {
        ctx.onCancel = () => {
          throw new Error('hoho') // <---- should be silently ignored
        }
        results.push('a_' + value)
        await delayPromise(2)
        return value + '_mapped'
      })
        .queueTap(async (value) => {
          results.push('b_' + value)
          await delayPromise(2)
        })
        .onBusy(() => {
          results.push('on_busy')
        })
        .onIdle(() => {
          results.push('on_idle')
        })

      pipe.pump(1)
      await delayPromise(1)
      pipe.buffersClearAll()
      await delayPromise(2)

      pipe.pump(4000)

      await delayPromise(10)
      expect(results).to.eql(expected)
    }

    describe('Tap', () => {
      it('silently swallows the error', () => {
        return testInput('cancelTap', [
          'on_busy',
          'a_1',
          'on_idle',
          'on_busy',
          'a_4000',
          'b_4000',
          'on_idle',
        ])
      })
    })

    describe('Map', () => {
      it('silently swallows the error', () => {
        return testInput('cancelMap', [
          'on_busy',
          'a_1',
          'on_idle',
          'on_busy',
          'a_4000',
          'b_4000_mapped',
          'on_idle',
        ])
      })
    })
  })
})
