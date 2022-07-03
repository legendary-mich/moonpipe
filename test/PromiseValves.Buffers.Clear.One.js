'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

describe('PromiseValves.Buffers.Clear.One.js', () => {

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

      pipe.pump(1)
      pipe.pump(20)
      pipe.pump(300)

      await delayPromise(4)
      pipe.buffersClearOne(0)

      pipe.pump(4000)

      await delayPromise(20)
      expect(results).to.eql(expected)
    }

    describe('Tap', () => {
      it('pumps ORIGINAL values', () => {
        return testInput('queueTap', [
          'a_1',
          'b_1',
          'a_20',
          'a_4000',
          'b_4000',
        ])
      })
    })

    describe('Map', () => {
      it('pumps MODIFIED values', () => {
        return testInput('queueMap', [
          'a_1',
          'b_1_mapped',
          'a_20',
          'a_4000',
          'b_4000_mapped',
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

      pipe.pump(1)
      await delayPromise(1)
      pipe.buffersClearOne(0)
      await delayPromise(2)

      pipe.pump(4000)

      await delayPromise(10)
      expect(results).to.eql(expected)
    }

    describe('Tap', () => {
      it('cancels initial promises, and resolves the last one with the ORIGINAL value', () => {
        return testInput('cancelTap', [
          'a_1',
          'a_4000',
          'b_4000',
        ])
      })
    })

    describe('Map', () => {
      it('cancels initial promises, and resolves the last one with a MODIFIED value', () => {
        return testInput('cancelMap', [
          'a_1',
          'a_4000',
          'b_4000_mapped',
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

      pipe.pump(1)
      await delayPromise(1)
      pipe.buffersClearOne(0)
      await delayPromise(2)

      pipe.pump(4000)

      await delayPromise(10)
      expect(results).to.eql(expected)
    }

    describe('Tap', () => {
      it('removes values which are waiting in the queue, and pumps ORIGINAL ones', () => {
        return testInput('throttleTap', [
          'a_1',
          'a_4000',
          'b_4000',
        ])
      })
    })

    describe('Map', () => {
      it('removes values which are waiting in the queue, and pumps MODIFIED ones', () => {
        return testInput('throttleMap', [
          'a_1',
          'a_4000',
          'b_4000_mapped',
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

      pipe.pump(1)
      await delayPromise(1)
      pipe.buffersClearOne(0)
      await delayPromise(2)

      pipe.pump(4000)

      await delayPromise(10)
      expect(results).to.eql(expected)
    }

    describe('Tap', () => {
      it('whatever', () => {
        return testInput('skipTap', [
          'a_1',
          'a_4000',
          'b_4000',
        ])
      })
    })

    describe('Map', () => {
      it('whatever', () => {
        return testInput('skipMap', [
          'a_1',
          'a_4000',
          'b_4000_mapped',
        ])
      })
    })
  })
})
