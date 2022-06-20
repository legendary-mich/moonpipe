'use strict'

const { expect } = require('chai')
const {
  MudPipe,
  BaseValve,
  BasePresets,
} = require('../index.js')

describe('MudPipe', () => {

  describe('pipe', () => {
    it('throws for a missing valve', () => {
      const mudPipe = new MudPipe()
      try {
        mudPipe.pipe()
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected 'valve' to derive from (or be an instance of) a 'BaseValve'")
      }
    })

    it('throws for a valve which is not an instance of BaseValve', () => {
      const mudPipe = new MudPipe()
      try {
        mudPipe.pipe(2)
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected 'valve' to derive from (or be an instance of) a 'BaseValve'")
      }
    })

    it('throws for a channel which is outside of the enum range', () => {
      const mudPipe = new MudPipe()
      try {
        mudPipe.pipe(new BaseValve(BasePresets.queue), 'haha')
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Unexpected 'channel' name: haha")
      }
    })
  })

  describe('buffersClearOne', () => {
    it('throws for a missing valveIndex', () => {
      const mudPipe = new MudPipe()
      try {
        mudPipe.buffersClearOne()
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected valveIndex to be a 'number' greater than 0 and smaller than 0; found: undefined")
      }
    })

    it('throws for valveIndex lower than 0', () => {
      const mudPipe = new MudPipe().queueLazy(1)
      try {
        mudPipe.buffersClearOne(-1)
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected valveIndex to be a 'number' greater than 0 and smaller than 1; found: -1")
      }
    })

    it('throws for valveIndex greater than the max index', () => {
      const mudPipe = new MudPipe().queueLazy(1).queueLazy(1)
      try {
        mudPipe.buffersClearOne(2)
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected valveIndex to be a 'number' greater than 0 and smaller than 2; found: 2")
      }
    })
  })

  describe('cacheClearOne', () => {
    it('throws for a missing valveIndex', () => {
      const mudPipe = new MudPipe()
      try {
        mudPipe.cacheClearOne()
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected valveIndex to be a 'number' greater than 0 and smaller than 0; found: undefined")
      }
    })

    it('throws for valveIndex lower than 0', () => {
      const mudPipe = new MudPipe().queueLazy(1)
      try {
        mudPipe.cacheClearOne(-1)
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected valveIndex to be a 'number' greater than 0 and smaller than 1; found: -1")
      }
    })

    it('throws for valveIndex greater than the max index', () => {
      const mudPipe = new MudPipe().queueLazy(1).queueLazy(1)
      try {
        mudPipe.cacheClearOne(2)
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected valveIndex to be a 'number' greater than 0 and smaller than 2; found: 2")
      }
    })

    it('does not throw if called on a timeValve', () => {
      const mudPipe = new MudPipe().queueEager(1)
      mudPipe.cacheClearOne(0)
    })

    it('does not throw if called on a timeValve at a key', () => {
      const mudPipe = new MudPipe().queueEager(1)
      mudPipe.cacheClearOne(0, 100)
    })

    it('does not throw if called on a transformValve', () => {
      const mudPipe = new MudPipe().map(() => 'zz')
      mudPipe.cacheClearOne(0)
    })

    it('does not throw if called on a transformValve at a key', () => {
      const mudPipe = new MudPipe().map(() => 'zz')
      mudPipe.cacheClearOne(0, 100)
    })
  })

  describe('options in', () => {
    describe('promise operators', () => {
      function testCase(method) {
        it(`${ method } passes options on`, () => {
          const mp = new MudPipe()[method](() => Promise.resolve(), {
            maxBufferSize: 3,
          })
          expect(mp.getChannelValveAt(0).valve.maxBufferSize).eql(3)
        })
      }

      testCase('queueTap')
      testCase('queueMap')
      testCase('queueError')
      testCase('cancelTap')
      testCase('cancelMap')
      testCase('cancelError')
      testCase('throttleTap')
      testCase('throttleMap')
      testCase('throttleError')
      testCase('skipTap')
      testCase('skipMap')
      testCase('skipError')
    })

    describe('time operators', () => {
      function testCase(method) {
        it(`${ method } passes options on`, () => {
          const mp = new MudPipe()[method](1, {
            maxBufferSize: 3,
          })
          expect(mp.getChannelValveAt(0).valve.maxBufferSize).eql(3)
        })
      }

      testCase('queueEager')
      testCase('queueLazy')
      testCase('cancelEager')
      testCase('cancelLazy')
      testCase('throttleEager')
      testCase('throttleLazy')
      testCase('skipEager')
      testCase('skipLazy')
    })

    describe('slice promise operators', () => {
      function testCase(method) {
        it(`${ method } passes options on`, () => {
          const mp = new MudPipe()[method](1, () => Promise.resolve(), {
            maxBufferSize: 3,
          })
          expect(mp.getChannelValveAt(0).valve.maxBufferSize).eql(3)
        })
      }

      testCase('sliceTap')
      testCase('sliceMap')
    })

    describe('slice time operators', () => {
      function testCase(method) {
        it(`${ method } passes options on`, () => {
          const mp = new MudPipe()[method](1, 1, {
            maxBufferSize: 3,
          })
          expect(mp.getChannelValveAt(0).valve.maxBufferSize).eql(3)
        })
      }

      testCase('sliceEager')
      testCase('sliceLazy')
    })

    describe('flatten operator', () => {
      function testCase(method) {
        it(`${ method } passes options on`, () => {
          const mp = new MudPipe()[method]({
            maxBufferSize: 3,
          })
          expect(mp.getChannelValveAt(0).valve.maxBufferSize).eql(3)
        })
      }

      testCase('flatten')
    })

    describe('pool promise operators', () => {
      function testCase(method) {
        it(`${ method } passes options on`, () => {
          const mp = new MudPipe()[method](1, () => Promise.resolve(), {
            maxBufferSize: 3,
          })
          expect(mp.getChannelValveAt(0).valve.maxBufferSize).eql(3)
        })
      }

      testCase('poolTap')
      testCase('poolMap')
    })

    describe('transform operators', () => {
      function testCase(method) {
        it(`${ method } passes options on`, () => {
          const mp = new MudPipe()[method](() => true, {
            maxBufferSize: 3,
          })
          expect(mp.getChannelValveAt(0).valve.maxBufferSize).eql(3)
        })
      }

      testCase('map')
      testCase('filter')
    })
  })
})
