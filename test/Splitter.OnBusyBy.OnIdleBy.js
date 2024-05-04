'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

describe('Splitter.OnBusyBy.OnIdleBy.js', () => {

  describe('ErrorHandler with Asynchronous input.', () => {
    async function testInput(method, expected) {
      const results = []
      const pipe = new MoonPipe()
        .splitBy(1, () => 's')
        .onBusyBy((value) => {
          results.push('on_busy_hook_' + value)
          if (method === 'onBusyBy') {
            throw new Error('on_busy_hook_err')
          }
        })
        .queueTap(() => {})
        .onIdleBy((value) => {
          results.push('on_idle_hook_' + value)
          if (method === 'onIdleBy') {
            throw new Error('on_idle_hook_err')
          }
        })
        .join()
        .queueTap(async (value) => {
          results.push('res_' + value)
        })
        .queueError(async (err) => {
          await delayPromise(2)
          results.push('err_' + err.message)
        })

      pipe.pump(1)
      await Promise.resolve()
      pipe.pump(2)
      await Promise.resolve()
      pipe.pump(3)
      await delayPromise(16)
      expect(results).to.eql(expected)
    }

    it('onBusyBy', () => {
      return testInput('onBusyBy', [
        'on_busy_hook_s',
        'err_on_busy_hook_err',
        // 'res_1', // this is where the error is emitted
        'res_2',
        'res_3',
        'on_idle_hook_s',
      ])
    })

    it('onIdleBy', () => {
      return testInput('onIdleBy', [
        'on_busy_hook_s',
        'res_1',
        'res_2',
        'res_3',
        'on_idle_hook_s',
        'err_on_idle_hook_err',
      ])
    })
  })

  describe('single splitter', () => {

    class Test {
      constructor(poolSize, classifyFn) {
        expect(poolSize).to.be.a('number')
        expect(classifyFn).to.be.a('function')
        this.poolSize = poolSize
        this.classifyFn = classifyFn

      }
      async testInput(method, expected) {
        const results = []
        const mp = new MoonPipe()
          .onBusy(() => results.push('busy'))
          .splitBy(this.poolSize, this.classifyFn)
          .onBusyBy(key => {
            results.push('busy_by_' + key)
          })[method](value => value + 100)
          .queueTap(value => {
            results.push('res_' + value)
          })
          .onIdleBy(key => {
            results.push('idle_by_'+ key)
          })
          .join()
          .queueError(err => {
            results.push(err)
          })
          .onIdle(() => results.push('idle'))

        mp.pump(1)
        mp.pump(2)
        mp.pump(3)
        mp.pump(4)
        await delayPromise(2)
        expect(results).to.eql(expected)
      }
    }

    describe('1 pipe, 1 bucket', () => {
      it('with queueMap', async () => {
        const test = new Test(1, () => 'ssa')
        await test.testInput('queueMap', [
          'busy',
          'busy_by_ssa',
          'res_101',
          'res_102',
          'res_103',
          'res_104',
          'idle_by_ssa',
          'idle',
        ])
      })
    })

    describe('1 pipe, 2 buckets', () => {
      it('with queueMap', async () => {
        const test = new Test(1, val => val % 2)
        await test.testInput('queueMap', [
          'busy',
          'busy_by_1',
          'busy_by_0',
          'res_101',
          'res_103',
          'idle_by_1',
          'res_102',
          'res_104',
          'idle_by_0',
          'idle',
        ])
      })
    })

    describe('2 pipes, 2 buckets', () => {
      it('with queueMap', async () => {
        const test = new Test(2, val => val % 2)
        await test.testInput('queueMap', [
          'busy',
          'busy_by_1',
          'busy_by_0',
          'res_101',
          'res_102',
          'res_103',
          'res_104',
          'idle_by_1',
          'idle_by_0',
          'idle',
        ])
      })
    })
  })

  describe('single splitter with a gap', () => {

    class Test {
      constructor(poolSize, classifyFn) {
        expect(poolSize).to.be.a('number')
        expect(classifyFn).to.be.a('function')
        this.poolSize = poolSize
        this.classifyFn = classifyFn

      }
      async testInput(method, expected) {
        const results = []
        const mp = new MoonPipe()
          .onBusy(() => results.push('busy'))
          .splitBy(this.poolSize, this.classifyFn)
          .onBusyBy(key => {
            results.push('busy_by_' + key)
          })[method](value => value + 100)
          .queueTap(value => {
            results.push('res_' + value)
          })
          .onIdleBy(key => {
            results.push('idle_by_'+ key)
          })
          .join()
          .queueError(err => {
            results.push(err)
          })
          .onIdle(() => results.push('idle'))

        mp.pump(1)
        mp.pump(2)
        mp.pump(3)
        mp.pump(4)
        await delayPromise(2)
        mp.pump(1)
        mp.pump(2)
        mp.pump(3)
        mp.pump(4)
        await delayPromise(2)
        expect(results).to.eql(expected)

      }
    }

    describe('1 pipe, 1 bucket', () => {
      it('with queueMap', async () => {
        const test = new Test(1, () => 'ssa')
        await test.testInput('queueMap', [
          'busy',
          'busy_by_ssa',
          'res_101',
          'res_102',
          'res_103',
          'res_104',
          'idle_by_ssa',
          'idle',
          'busy',
          'busy_by_ssa',
          'res_101',
          'res_102',
          'res_103',
          'res_104',
          'idle_by_ssa',
          'idle',
        ])
      })
    })

    describe('1 pipe, 2 buckets', () => {
      it('with queueMap', async () => {
        const test = new Test(1, val => val % 2)
        await test.testInput('queueMap', [
          'busy',
          'busy_by_1',
          'busy_by_0',
          'res_101',
          'res_103',
          'idle_by_1',
          'res_102',
          'res_104',
          'idle_by_0',
          'idle',
          'busy',
          'busy_by_1',
          'busy_by_0',
          'res_101',
          'res_103',
          'idle_by_1',
          'res_102',
          'res_104',
          'idle_by_0',
          'idle',
        ])
      })
    })

    describe('2 pipes, 2 buckets', () => {
      it('with queueMap', async () => {
        const test = new Test(2, val => val % 2)
        await test.testInput('queueMap', [
          'busy',
          'busy_by_1',
          'busy_by_0',
          'res_101',
          'res_102',
          'res_103',
          'res_104',
          'idle_by_1',
          'idle_by_0',
          'idle',
          'busy',
          'busy_by_1',
          'busy_by_0',
          'res_101',
          'res_102',
          'res_103',
          'res_104',
          'idle_by_1',
          'idle_by_0',
          'idle',
        ])
      })
    })
  })

  describe('single splitter with no valves', () => {

    class Test {
      constructor(poolSize, classifyFn) {
        expect(poolSize).to.be.a('number')
        expect(classifyFn).to.be.a('function')
        this.poolSize = poolSize
        this.classifyFn = classifyFn

      }
      async testInput(method, expected) {
        const results = []
        const mp = new MoonPipe()
          .onBusy(() => results.push('busy'))
          .splitBy(this.poolSize, this.classifyFn)
          .onBusyBy(key => {
            results.push('busy_by_' + key)
          })
          .onIdleBy(key => {
            results.push('idle_by_'+ key)
          })
          .join()
          .queueError(err => {
            results.push(err)
          })
          .onIdle(() => results.push('idle'))

        mp.pump(1)
        mp.pump(2)
        await delayPromise(2)
        expect(results).to.eql(expected)

      }
    }

    describe('1 pipe, 1 bucket', () => {
      it('with queueMap', async () => {
        const test = new Test(1, () => 'ssa')
        await test.testInput('queueMap', [
          'busy',
          'busy_by_ssa',
          'idle_by_ssa',
          'idle',
          'busy',
          'busy_by_ssa',
          'idle_by_ssa',
          'idle',
        ])
      })
    })

    describe('1 pipe, 2 buckets', () => {
      it('with queueMap', async () => {
        const test = new Test(1, val => val % 2)
        await test.testInput('queueMap', [
          'busy',
          'busy_by_1',
          'idle_by_1',
          'idle',
          'busy',
          'busy_by_0',
          'idle_by_0',
          'idle',
        ])
      })
    })

    describe('2 pipes, 2 buckets', () => {
      it('with queueMap', async () => {
        const test = new Test(2, val => val % 2)
        await test.testInput('queueMap', [
          'busy',
          'busy_by_1',
          'idle_by_1',
          'idle',
          'busy',
          'busy_by_0',
          'idle_by_0',
          'idle',
        ])
      })
    })
  })

  describe('nested splitters', () => {

    class Test {
      constructor(poolSize, classifyFn_1, classifyFn_2) {
        expect(poolSize).to.be.a('number')
        expect(classifyFn_1).to.be.a('function')
        expect(classifyFn_2).to.be.a('function')
        this.poolSize = poolSize
        this.classifyFn_1 = classifyFn_1
        this.classifyFn_2 = classifyFn_2

      }
      async testInput(expected) {
        const results = []
        const mp = new MoonPipe()
          .onBusy(() => results.push('busy'))
          .splitBy(this.poolSize, this.classifyFn_1, {name: '1st'})
          .onBusyBy(key => {
            results.push('1st_busy_by_' + key)
          })
          .splitBy(this.poolSize, this.classifyFn_2, {name: '2nd'})
          .onBusyBy(key => {
            results.push('2nd_busy_by_' + key)
          })
          .queueTap(value => {
            results.push(value.color + '_res_' + value.id)
          })
          .onIdleBy(key => {
            results.push('2nd_idle_by_'+ key)
          })
          .join()
          .onIdleBy(key => {
            results.push('1st_idle_by_'+ key)
          })
          .join()
          .queueError(err => {
            results.push(err)
          })
          .onIdle(() => results.push('idle'))

        mp.pump({color: 'green', id: 1})
        mp.pump({color: 'green', id: 2})
        mp.pump({color: 'red__', id: 1})
        mp.pump({color: 'red__', id: 2})
        await delayPromise(2)
        expect(results).to.eql(expected)

      }
    }

    describe('1 pipe, 1 bucket, 1 bucket', () => {
      it('works', async () => {
        const test = new Test(1, () => 'ssa', () => 'lux')
        await test.testInput([
          'busy',
          '1st_busy_by_ssa',
          '2nd_busy_by_lux',
          'green_res_1',
          'green_res_2',
          'red___res_1',
          'red___res_2',
          '2nd_idle_by_lux',
          '1st_idle_by_ssa',
          'idle',
        ])
      })
    })

    describe('1 pipe, 1 bucket, 2 buckets', () => {
      it('works', async () => {
        const test = new Test(1, () => 'b', ({id}) => id)
        await test.testInput([
          'busy',
          '1st_busy_by_b',
          '2nd_busy_by_1',
          'green_res_1',
          '2nd_busy_by_2',
          'red___res_1',
          '2nd_idle_by_1',
          'green_res_2',
          'red___res_2',
          '2nd_idle_by_2',
          '1st_idle_by_b',
          'idle',
        ])
      })
    })

    describe('1 pipe, 2 buckets, 2 buckets', () => {
      it('works', async () => {
        const test = new Test(1, ({color}) => color, ({id}) => id)
        await test.testInput([
          'busy',
          '1st_busy_by_green',
          '2nd_busy_by_1',
          'green_res_1',
          '2nd_busy_by_2',
          '1st_busy_by_red__',
          '2nd_idle_by_1',
          'green_res_2',
          '2nd_idle_by_2',
          '1st_idle_by_green',
          '2nd_busy_by_1',
          'red___res_1',
          '2nd_busy_by_2',
          '2nd_idle_by_1',
          'red___res_2',
          '2nd_idle_by_2',
          '1st_idle_by_red__',
          'idle',
        ])
      })
    })

  })

})
