'use strict'

const { expect } = require('chai')
const {
  MoonPipe,
  BaseValve,
  BasePresets,
} = require('../index.js')
const { delayPromise } = require('./utils.js')

describe('MoonPipe', () => {

  describe('pipe', () => {
    it('throws for a missing valve', () => {
      const moonPipe = new MoonPipe()
      try {
        moonPipe.pipe()
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected 'valve' to derive from (or be an instance of) a 'BaseValve' or 'Splitter'")
      }
    })

    it('throws for a valve which is not an instance of BaseValve', () => {
      const moonPipe = new MoonPipe()
      try {
        moonPipe.pipe(2)
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected 'valve' to derive from (or be an instance of) a 'BaseValve' or 'Splitter'")
      }
    })

    it('throws for a channel which is outside of the enum range', () => {
      const moonPipe = new MoonPipe()
      try {
        moonPipe.pipe(new BaseValve(BasePresets.queue), 'haha')
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Unexpected 'channel' name: haha")
      }
    })

    it('throws for a valve with an occupied name', () => {
      const moonPipe = new MoonPipe()
      try {
        const preset1 = Object.assign({}, BasePresets.queue, { name: 'one' })
        const preset2 = Object.assign({}, BasePresets.queue, { name: 'one' })
        moonPipe.pipe(new BaseValve(preset1))
        moonPipe.pipe(new BaseValve(preset2))
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "A valve named: 'one' already exists")
      }
    })
  })

  describe('buffersClearOne', () => {
    it('throws for a missing valveName', () => {
      const moonPipe = new MoonPipe()
      try {
        moonPipe.buffersClearOne()
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected valveName to be a 'string'; found: undefined")
      }
    })

    it('throws for valveName not being a string', () => {
      const moonPipe = new MoonPipe().queueLazy(1)
      try {
        moonPipe.buffersClearOne(2)
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected valveName to be a 'string'; found: 2")
      }
    })

    it('throws if a valve with a given valveName is missing', () => {
      const moonPipe = new MoonPipe().queueLazy(1)
      try {
        moonPipe.buffersClearOne('valve-1')
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "A valve named: 'valve-1' does not exist")
      }
    })

    it('does not throw if called on a timeValve', () => {
      const moonPipe = new MoonPipe().queueEager(1, { name: 'valve-1' })
      moonPipe.buffersClearOne('valve-1')
    })

    it('does not throw if called on a synchronousValve', () => {
      const moonPipe = new MoonPipe().map(() => 'zz', { name: 'valve-3' })
      moonPipe.buffersClearOne('valve-3')
    })
  })

  describe('cacheClearOne', () => {
    it('throws for a missing valveName', () => {
      const moonPipe = new MoonPipe()
      try {
        moonPipe.cacheClearOne()
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected valveName to be a 'string'; found: undefined")
      }
    })

    it('throws for valveName not being a string', () => {
      const moonPipe = new MoonPipe().queueLazy(1).queueLazy(1)
      try {
        moonPipe.cacheClearOne(2)
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected valveName to be a 'string'; found: 2")
      }
    })

    it('throws if a valve with a given valveName is missing', () => {
      const moonPipe = new MoonPipe().queueLazy(1).queueLazy(1)
      try {
        moonPipe.cacheClearOne('valve-1')
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "A valve named: 'valve-1' does not exist")
      }
    })

    it('does not throw if called on a timeValve', () => {
      const moonPipe = new MoonPipe().queueEager(1, { name: 'valve-1' })
      moonPipe.cacheClearOne('valve-1')
    })

    it('does not throw if called on a timeValve at a key', () => {
      const moonPipe = new MoonPipe().queueEager(1, { name: 'valve-2' })
      moonPipe.cacheClearOne('valve-2', 100)
    })

    it('does not throw if called on a synchronousValve', () => {
      const moonPipe = new MoonPipe().map(() => 'zz', { name: 'valve-3' })
      moonPipe.cacheClearOne('valve-3')
    })

    it('does not throw if called on a synchronousValve at a key', () => {
      const moonPipe = new MoonPipe().map(() => 'zz', { name: 'valve-4' })
      moonPipe.cacheClearOne('valve-4', 100)
    })
  })

  describe('options in', () => {
    describe('promise valves', () => {
      function testCase(method) {
        it(`${ method } passes options on`, () => {
          const mp = new MoonPipe()[method](() => Promise.resolve(), {
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

    describe('time valves', () => {
      function testCase(method) {
        it(`${ method } passes options on`, () => {
          const mp = new MoonPipe()[method](1, {
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

    describe('slice promise valves', () => {
      function testCase(method) {
        it(`${ method } passes options on`, () => {
          const mp = new MoonPipe()[method](1, () => Promise.resolve(), {
            maxBufferSize: 3,
          })
          expect(mp.getChannelValveAt(0).valve.maxBufferSize).eql(3)
        })
      }

      testCase('sliceTap')
      testCase('sliceMap')
    })

    describe('slice time valves', () => {
      function testCase(method) {
        it(`${ method } passes options on`, () => {
          const mp = new MoonPipe()[method](1, 1, {
            maxBufferSize: 3,
          })
          expect(mp.getChannelValveAt(0).valve.maxBufferSize).eql(3)
        })
      }

      testCase('sliceEager')
      testCase('sliceLazy')
    })

    describe('flatten valve', () => {
      function testCase(method) {
        it(`${ method } passes options on`, () => {
          const mp = new MoonPipe()[method]({
            maxBufferSize: 3,
          })
          expect(mp.getChannelValveAt(0).valve.maxBufferSize).eql(3)
        })
      }

      testCase('flatten')
    })

    describe('pool promise valves', () => {
      function testCase(method) {
        it(`${ method } passes options on`, () => {
          const mp = new MoonPipe()[method](1, () => Promise.resolve(), {
            maxBufferSize: 3,
          })
          expect(mp.getChannelValveAt(0).valve.maxBufferSize).eql(3)
        })
      }

      testCase('poolTap')
      testCase('poolMap')
    })

    describe('synchronous valves', () => {
      function testCase(method) {
        it(`${ method } passes options on`, () => {
          const mp = new MoonPipe()[method](() => true, {
            maxBufferSize: 3,
          })
          expect(mp.getChannelValveAt(0).valve.maxBufferSize).eql(3)
        })
      }

      testCase('map')
      testCase('filter')
    })

    describe('splitBy', () => {
      function testCase(method) {
        it(`${ method } passes options on`, () => {
          const classifyFn = () => 1
          const poolSize = 2
          const mp = new MoonPipe()
            .splitBy(poolSize, classifyFn)

          expect(mp.getChannelValveAt(0).valve.classify).eql(classifyFn)
          expect(mp.getChannelValveAt(0).valve.poolSize).eql(2)
        })
      }

      testCase('map')
      testCase('filter')
    })
  })

  describe('hooks', () => {
    function testValidation(hookName) {
      it('throws for a missing callback', () => {
        const moonPipe = new MoonPipe()
        try {
          moonPipe[hookName]()
          throw new Error('should have thrown')
        }
        catch (err) {
          expect(err).to.have.property('message', "Unexpected 'callback': undefined")
        }
      })

      it('throws for a wrong type callback', () => {
        const moonPipe = new MoonPipe()
        try {
          moonPipe[hookName]('ss')
          throw new Error('should have thrown')
        }
        catch (err) {
          expect(err).to.have.property('message', "Unexpected 'callback': ss")
        }
      })

      it('throws when a callback is added twice', () => {
        const moonPipe = new MoonPipe()
        try {
          moonPipe[hookName](() => {})
          moonPipe[hookName](() => {})
          throw new Error('should have thrown')
        }
        catch (err) {
          expect(err).to.have.property('message', "Only one callback allowed")
        }
      })
    }

    describe('onBusyTap', () => {
      testValidation('onBusyTap')
    })

    describe('onIdle', () => {
      testValidation('onIdle')
    })

    describe('onData', () => {
      testValidation('onData')

      it('emits when no valves are attached', () => {
        const results = []
        const mp = new MoonPipe()
          .onData(value => results.push(value))
        mp.pump(2)
        expect(results).to.eql([2])
      })

      it('emits when a synchronous valve is attached', () => {
        const results = []
        const mp = new MoonPipe()
          .map(value => value * 2)
          .onData(value => results.push(value))
        mp.pump(2)
        expect(results).to.eql([4])
      })

      it('emits when a Promise valve is attached', async () => {
        const results = []
        const mp = new MoonPipe()
          .queueMap(value => value * 2)
          .onData(value => results.push(value))
        mp.pump(2)
        await delayPromise(2)
        expect(results).to.eql([4])
      })

      it('emits when a Time valve is attached', async () => {
        const results = []
        const mp = new MoonPipe()
          .queueLazy(0)
          .onData(value => results.push(value))
        mp.pump(2)
        await delayPromise(2)
        expect(results).to.eql([2])
      })

      it('emits when 2 valves are attached', async () => {
        const results = []
        const mp = new MoonPipe()
          .queueMap(value => value * 2)
          .queueMap(value => value * 2)
          .onData(value => results.push(value))
        mp.pump(2)
        await delayPromise(2)
        expect(results).to.eql([8])
      })

      it('emits twice when 2 values are pumped', async () => {
        const results = []
        const mp = new MoonPipe()
          .queueMap(value => value * 2)
          .queueMap(value => value * 2)
          .onData(value => results.push(value))
        mp.pump(2)
        mp.pump(100)
        await delayPromise(2)
        expect(results).to.eql([8, 400])
      })

      it('emits when an empty Splitter is attached', async () => {
        const results = []
        const mp = new MoonPipe()
          .splitBy(1, () => 100)
          .onData(value => results.push(value))
        mp.pump(2)
        await delayPromise(2)
        expect(results).to.eql([2])
      })

      it('emits when 2 empty Splitters are attached', async () => {
        const results = []
        const mp = new MoonPipe()
          .splitBy(1, () => 100)
          .join()
          .splitBy(1, () => 100)
          .onData(value => results.push(value))
        mp.pump(2)
        await delayPromise(2)
        expect(results).to.eql([2])
      })

      it('emits when a non-empty Splitter is attached', async () => {
        const results = []
        const mp = new MoonPipe()
          .splitBy(1, () => 100)
          .queueMap(value => value + 100)
          .onData(value => results.push(value))
        mp.pump(2)
        await delayPromise(2)
        expect(results).to.eql([102])
      })

      it('emits when 2 non-empty Splitters are attached', async () => {
        const results = []
        const mp = new MoonPipe()
          .splitBy(1, () => 100)
          .queueMap(value => value + 100)
          .join()
          .splitBy(1, () => 100)
          .queueMap(value => value + 100)
          .onData(value => results.push(value))
        mp.pump(2)
        await delayPromise(2)
        expect(results).to.eql([202])
      })

      it('emits when 2 non-empty nested Splitters are attached', async () => {
        const results = []
        const mp = new MoonPipe()
          .splitBy(1, () => 100)
          .queueMap(value => value + 100)
          .splitBy(1, () => 100)
          .queueMap(value => value + 100)
          .onData(value => results.push(value))
        mp.pump(2)
        await delayPromise(2)
        expect(results).to.eql([202])
      })

      it('emits when the pipe is in an ERROR state', async () => {
        const results = []
        const mp = new MoonPipe()
          .queueMap(async value => {
            if (value === 2) {
              await delayPromise(2)
              throw 'map_err_' + value
            }
            return value
          })
          .queueMap(async value => {
            await delayPromise(4)
            return value
          })
          .queueError(async (err) => {
            await delayPromise(4)
            return 'handled_' + err
          })
          .onData(value => results.push('on_data_' + value))
        mp.pump(1)
        mp.pump(2)
        await delayPromise(20)
        expect(results).to.eql([
          'on_data_1',
          'on_data_handled_map_err_2',
        ])
      })
    })

    describe('onError', () => {
      testValidation('onError')

      it('emits when a synchronous valve is attached', () => {
        const results = []
        const mp = new MoonPipe()
          .map(value => { throw 'err_' + value })
          .onError(value => results.push(value))
        mp.pump(2)
        expect(results).to.eql(['err_2'])
      })

      it('emits when a Promise valve is attached', async () => {
        const results = []
        const mp = new MoonPipe()
          .queueMap(value => { throw 'err_' + value })
          .onError(value => results.push(value))
        mp.pump(4)
        await delayPromise(2)
        expect(results).to.eql(['err_4'])
      })

      it('emits when a non-empty Splitter is attached', async () => {
        const results = []
        const mp = new MoonPipe()
          .splitBy(1, () => 100)
          .queueMap(value => { throw 'err_' + value })
          .onError(value => results.push(value))
        mp.pump(2)
        await delayPromise(2)
        expect(results).to.eql(['err_2'])
      })

      it('emits when 2 non-empty nested Splitters are attached', async () => {
        const results = []
        const mp = new MoonPipe()
          .splitBy(1, () => 100)
          .queueMap(value => value + 100)
          .splitBy(1, () => 100)
          .queueMap(value => { throw 'err_' + value })
          .onError(value => results.push(value))
        mp.pump(2)
        await delayPromise(2)
        expect(results).to.eql(['err_102'])
      })

      it('if it is the last error, the the subsequent value is not blocked in any way', async () => {
        const results = []
        const mp = new MoonPipe()
          .map(value => {
            if (value === 2) {
              throw 'err_' + value
            }
            return value + 100
          })
          .map(value => {
            results.push('res_' + value)
            return value
          })
          .onError(value => results.push(value))
        mp.pump(2)
        mp.pump(3)
        expect(results).to.eql([
          'err_2',
          'res_103',
        ])
      })

      it('if it is NOT the last error, the subsequent value will wait for its turn', async () => {
        const results = []
        const mp = new MoonPipe()
          .map(value => {
            if (value === 2) {
              throw 'map_err_' + value
            }
            return value
          })
          .queueError(async (err) => {
            await delayPromise(10)
            return 'handled_' + err
          })
          .queueTap(async value => {
            if (value === 1) {
              await delayPromise(5)
              throw 'tap_err_' + value
            }
          })
          .map(value => {
            results.push('res_' + value)
            return value
          })
          .onError(value => results.push('on_err_' + value))
        mp.pump(1)
        mp.pump(2)
        await delayPromise(7)
        mp.pump(3)
        await delayPromise(20)
        expect(results).to.eql([
          'on_err_tap_err_1',
          'res_handled_map_err_2',
          'res_3',
        ])
        // The order when things are broken:
        //   'on_err_tap_err_1',
        //   'res_3',
        //   'res_handled_map_err_2',
        //
      })
    })
  })

  describe('join', () => {
    it('throws if no spliiters have been added', () => {
      const moonPipe = new MoonPipe()
      try {
        moonPipe.join()
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "There are no splitters to join")
      }
    })

    it('throws if called twice and only one splitter has been added', () => {
      const moonPipe = new MoonPipe()
      try {
        moonPipe.splitBy(1, () => 1)
        moonPipe.join()
        moonPipe.join()
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "There are no splitters to join")
      }
    })

    it('throws if called three times and only two splitters have been added', () => {
      const moonPipe = new MoonPipe()
      try {
        moonPipe.splitBy(1, () => 1)
        moonPipe.splitBy(1, () => 1)
        moonPipe.join()
        moonPipe.join()
        moonPipe.join()
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "There are no splitters to join")
      }
    })
  })
})
