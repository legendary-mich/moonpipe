'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

describe('Splitter.SpecialCases', () => {

  describe('when the classifyFn throws', () => {

    it('the data is emitted, if the splitter is empty', async () => {
      const results = []
      const mp = new MoonPipe()
        .splitBy(1, () => { throw 'split_by_err' })
        .join()
        .queueTap(value => {
          results.push('res_' + value)
        })
        .queueError(err => {
          results.push(err)
        })

      mp.pump(1)

      await delayPromise(2)

      expect(results).to.eql(['split_by_err'])
    })

    it('the error is emitted, if the splitter is NOT empty', async () => {
      const results = []
      const mp = new MoonPipe()
        .splitBy(1, () => { throw 'split_by_err' })
        .queueTap(value => {
          results.push('inner_res_' + value)
        })
        .join()
        .queueTap(value => {
          results.push('res_' + value)
        })
        .queueError(err => {
          results.push(err)
        })

      mp.pump(1)

      await delayPromise(2)

      expect(results).to.eql(['split_by_err'])
    })
  })

  describe('0 valves attached', () => {
    it('emits data', async () => {
      const results = []
      const mp = new MoonPipe()
        .onBusy(() => results.push('on_busy'))
        .splitBy(1, value => value % 1)
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
      await delayPromise(2)
      expect(results).to.eql([
        'on_busy',
        'res_1',
        'res_2',
        'on_idle',
      ])
    })
  })

  describe('1 valve attached', () => {
    it('emits data', async () => {
      const results = []
      const mp = new MoonPipe()
        .onBusy(() => results.push('on_busy'))
        .splitBy(1, value => value % 1)
        .queueMap(value => value + 100)
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
      await delayPromise(2)
      expect(results).to.eql(['on_busy', 'res_101', 'res_102', 'on_idle'])
    })
  })

  describe('2 valves attached', () => {
    it('emits data', async () => {
      const results = []
      const mp = new MoonPipe()
        .onBusy(() => results.push('on_busy'))
        .splitBy(1, value => value % 1)
        .queueMap(value => value + 100)
        .queueMap(value => value + 100)
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
      await delayPromise(2)
      expect(results).to.eql(['on_busy', 'res_201', 'res_202', 'on_idle'])
    })
  })

  describe('join in different places', () => {
    it('after skipTap', async () => {
      const results = []
      const mp = new MoonPipe()
        .onBusy(() => results.push('on_busy'))
        .splitBy(2, value => value % 2)
        .queueMap(value => {
          return value + 100
        })
        .skipTap(async () => {
          await delayPromise(2)
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
      mp.pump(2)
      mp.pump(3)
      mp.pump(4)
      await delayPromise(20)
      expect(results).to.eql([
        'on_busy',
        'res_101',
        'res_102',
        'on_idle',
      ])
    })

    it('before skipTap', async () => {
      const results = []
      const mp = new MoonPipe()
        .onBusy(() => results.push('on_busy'))
        .splitBy(2, value => value % 2)
        .queueMap(async value => {
          return value + 100
        })
        .join()
        .skipTap(async () => {
          await delayPromise(2)
        })
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
      await delayPromise(20)
      expect(results).to.eql([
        'on_busy',
        'res_101',
        'on_idle',
      ])
    })

    it('immediately after splitBy', async () => {
      const results = []
      const mp = new MoonPipe()
        .onBusy(() => results.push('on_busy'))
        .splitBy(2, value => value % 2)
        .join()
        .skipTap(async () => {
          await delayPromise(2)
        })
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
      await delayPromise(20)
      expect(results).to.eql([
        'on_busy',
        'res_1',
        'on_idle',
      ])
    })
  })

  describe('split -> join -> split -> join', () => {
    it('assertions for the state after join', async () => {
      const mp = new MoonPipe()
      expect(mp.gatewaySplitter).to.eql(null)

      mp.splitBy(3, value => value % 1)
      expect(mp.gatewaySplitter).to.not.eql(null)
      expect(mp.gatewaySplitter.idlePipes).to.have.lengthOf(3)
      for (const mp2 of mp.gatewaySplitter.idlePipes) {
        expect(mp2.gatewaySplitter).to.eql(null)
      }

      mp.join()
      expect(mp.gatewaySplitter).to.eql(null)

      mp.splitBy(5, value => value % 1)
      expect(mp.gatewaySplitter).to.not.eql(null)
      expect(mp.gatewaySplitter.idlePipes).to.have.lengthOf(5)
      for (const mp2 of mp.gatewaySplitter.idlePipes) {
        expect(mp2.gatewaySplitter).to.eql(null)
      }

      mp.join()
      expect(mp.gatewaySplitter).to.eql(null)
    })

    it('after skipTap', async () => {
      const results = []
      const mp = new MoonPipe()
        .onBusy(() => results.push('on_busy'))
        .splitBy(2, value => value % 2)
        .queueMap(value => {
          return value + 100
        })
        .join()
        .splitBy(2, value => value % 2)
        .skipTap(async () => {
          await delayPromise(2)
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
      mp.pump(2)
      mp.pump(3)
      mp.pump(4)
      await delayPromise(20)
      expect(results).to.eql([
        'on_busy',
        'res_101',
        'res_102',
        'on_idle',
      ])
    })

    it('before skipTap', async () => {
      const results = []
      const mp = new MoonPipe()
        .onBusy(() => results.push('on_busy'))
        .splitBy(2, value => value % 2)
        .queueMap(async value => {
          return value + 100
        })
        .join()
        .splitBy(2, value => value % 2)
        .join()
        .skipTap(async () => {
          await delayPromise(2)
        })
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
      await delayPromise(20)
      expect(results).to.eql([
        'on_busy',
        'res_101',
        'on_idle',
      ])
    })
  })

  describe('nested splitters', () => {
    it('assertions for the state after join', async () => {
      const mp = new MoonPipe()
      expect(mp.gatewaySplitter).to.eql(null)

      mp.splitBy(3, value => value % 1)
      expect(mp.gatewaySplitter).to.not.eql(null)
      expect(mp.gatewaySplitter.idlePipes).to.have.lengthOf(3)
      for (const mp2 of mp.gatewaySplitter.idlePipes) {
        expect(mp2.gatewaySplitter).to.eql(null)
      }

      mp.splitBy(4, value => value % 2)
      expect(mp.gatewaySplitter).to.not.eql(null)
      expect(mp.gatewaySplitter.idlePipes).to.have.lengthOf(3)
      for (const mp2 of mp.gatewaySplitter.idlePipes) {
        expect(mp2.gatewaySplitter).to.not.eql(null)
        expect(mp2.gatewaySplitter.idlePipes).to.have.lengthOf(4)
        for (const mp3 of mp2.gatewaySplitter.idlePipes) {
          expect(mp3.gatewaySplitter).to.eql(null)
        }
      }

      mp.join()
      expect(mp.gatewaySplitter).to.not.eql(null)
      expect(mp.gatewaySplitter.idlePipes).to.have.lengthOf(3)
      for (const mp2 of mp.gatewaySplitter.idlePipes) {
        expect(mp2.gatewaySplitter).to.eql(null)
      }

      mp.join()
      expect(mp.gatewaySplitter).to.eql(null)

      mp.splitBy(2, value => value % 1)
      expect(mp.gatewaySplitter).to.not.eql(null)
      expect(mp.gatewaySplitter.idlePipes).to.have.lengthOf(2)
      for (const mp2 of mp.gatewaySplitter.idlePipes) {
        expect(mp2.gatewaySplitter).to.eql(null)
      }
    })

    it('1st join after skipTap', async () => {
      const results = []
      const mp = new MoonPipe()
        .onBusy(() => results.push('on_busy'))
        .splitBy(2, value => value % 1)
        .splitBy(2, value => value % 2)
        .queueMap(value => {
          return value + 100
        })
        .skipTap(async () => {
          await delayPromise(2)
        })
        .join()
        .queueTap(value => {
          results.push('res_' + value)
        })
        .queueError(err => {
          results.push(err)
        })
        .join()
        .onIdle(() => results.push('on_idle'))

      mp.pump(1)
      mp.pump(2)
      mp.pump(3)
      mp.pump(4)
      await delayPromise(20)
      expect(results).to.eql([
        'on_busy',
        'res_101',
        'res_102',
        'on_idle',
      ])
    })

    it('1st join before skipTap', async () => {
      const results = []
      const mp = new MoonPipe()
        .onBusy(() => results.push('on_busy'))
        .splitBy(2, value => value % 1)
        .splitBy(2, value => value % 2)
        .queueMap(async value => {
          return value + 100
        })
        .join()
        .skipTap(async () => {
          await delayPromise(2)
        })
        .queueTap(value => {
          results.push('res_' + value)
        })
        .queueError(err => {
          results.push(err)
        })
        .join()
        .onIdle(() => results.push('on_idle'))

      mp.pump(1)
      mp.pump(2)
      mp.pump(3)
      mp.pump(4)
      await delayPromise(20)
      expect(results).to.eql([
        'on_busy',
        'res_101',
        'on_idle',
      ])
    })

    it('1st join immediately after splitBy', async () => {
      const results = []
      const mp = new MoonPipe()
        .onBusy(() => results.push('on_busy'))
        .splitBy(1, value => value % 1)
        .splitBy(2, value => value % 2)
        .join()
        .skipTap(async () => {
          await delayPromise(2)
        })
        .queueTap(value => {
          results.push('res_' + value)
        })
        .queueError(err => {
          results.push(err)
        })
        .join()
        .onIdle(() => results.push('on_idle'))

      mp.pump(1)
      mp.pump(2)
      mp.pump(3)
      mp.pump(4)
      await delayPromise(20)
      expect(results).to.eql([
        'on_busy',
        'res_1',
        'on_idle',
      ])
    })
  })

  describe('error valve (ERROR IN, DATA OUT) in a splitter', () => {
    it('emits data', async () => {
      const results = []
      const mp = new MoonPipe()
        .onBusy(() => results.push('on_busy'))
        .splitBy(1, value => value % 1)
        .queueMap(value => { throw new Error(value + 100) })
        .queueError(err => {
          results.push('err_' + err.message)
        })
        .join()
        .onIdle(() => results.push('on_idle'))

      mp.pump(1)
      mp.pump(2)
      await delayPromise(2)
      expect(results).to.eql([
        'on_busy',
        'err_101',
        'err_102',
        'on_idle',
      ])
    })
  })

  describe('filterError valve (ERROR IN, ERROR OUT) in a splitter', () => {
    it('emits data', async () => {
      const results = []
      const mp = new MoonPipe()
        .onBusy(() => results.push('on_busy'))
        .splitBy(1, value => value % 1)
        .queueMap(value => { throw new Error(value + 100) })
        // .filterError(err => true)
        .filterError(err => err.message === '102')
        .queueError(err => {
          results.push('err_' + err.message)
        })
        .join()
        .onIdle(() => results.push('on_idle'))

      mp.pump(1)
      mp.pump(2)
      await delayPromise(2)
      expect(results).to.eql([
        'on_busy',
        // 'err_101',
        'err_102',
        'on_idle',
      ])
    })
  })

})
