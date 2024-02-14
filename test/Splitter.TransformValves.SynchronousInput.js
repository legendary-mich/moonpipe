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
  async testInput(method, param, input, expected) {
    const results = []
    const mp = new MoonPipe()
      .onBusy(() => results.push('on_busy'))
      .splitBy(this.poolSize, this.classify
      )[method](param)
      .join()
      .queueTap(value => {
        results.push('res_' + value)
      })
      .queueError(err => {
        results.push('err_' + err.message)
      })
      .onIdle(() => results.push('on_idle'))

    for (const val of input) {
      mp.pump(val)
    }

    await delayPromise(5)
    expect(results).to.eql(expected)
  }
}

describe('Splitter.TransformValves', () => {

  describe('poolSize = 1, classify % 1', () => {
    let counter = 0
    const test = new Test(1, () => ++counter % 1)

    describe('MoonPipe.flatten', () => {
      it('emits an onData event for every item in the array', async () => {
        return test.testInput('flatten', null, [
          [1, 2],
          [10, 20],
          [100, 200],
          [1000, 2000],
        ], [
          'on_busy',
          'res_1',
          'res_2',
          'res_10',
          'res_20',
          'res_100',
          'res_200',
          'res_1000',
          'res_2000',
          'on_idle',
        ])
      })

      it('emits an error event if the value pumped is not an array', async () => {
        return test.testInput('flatten', null, [
          1,
          [10, 20],
          100,
          [1000, 2000],
        ], [
          'on_busy',
          'err_Expected an array; found: number',
          'res_10',
          'err_Expected an array; found: number',
          'res_20',
          'res_1000',
          'res_2000',
          'on_idle',
        ])
      })
    })

    describe('MoonPipe.map', () => {
      it('emits an onData event for every item in the array', async () => {
        return test.testInput('map', val =>  val * 2, [
          1,
          2,
          3,
          4,
        ], [
          'on_busy',
          'res_2',
          'res_4',
          'res_6',
          'res_8',
          'on_idle',
        ])
      })

      it('emits an onError event when the function throws', async () => {
        return test.testInput('map', () => { throw new Error('wrong') }, [
          1,
          2,
          3,
          4,
        ], [
          'on_busy',
          'err_wrong',
          'err_wrong',
          'err_wrong',
          'err_wrong',
          'on_idle',
        ])
      })
    })

    describe('MoonPipe.filter', () => {
      it('emits an onData event for every item in the array', async () => {
        return test.testInput('filter', val => val % 2, [
          1,
          1,
          2,
          2,
          3,
          3,
          4,
          4,
        ], [
          'on_busy',
          'res_1',
          'res_1',
          'res_3',
          'res_3',
          'on_idle',
        ])
      })

      it('emits an onError event when the function throws', async () => {
        return test.testInput('filter', () => { throw new Error('zonk') }, [
          1,
          2,
          3,
          4,
        ], [
          'on_busy',
          'err_zonk',
          'err_zonk',
          'err_zonk',
          'err_zonk',
          'on_idle',
        ])
      })
    })
  })

  describe('poolSize = 1, classify % 2', () => {
    let counter = 0
    const test = new Test(1, () => ++counter % 2)

    describe('MoonPipe.flatten', () => {
      it('emits an onData event for every item in the array', async () => {
        return test.testInput('flatten', null, [
          [1, 2],
          [10, 20],
          [100, 200],
          [1000, 2000],
        ], [
          'on_busy',
          'res_1',
          'res_2',
          'res_10',
          'res_20',
          'res_100',
          'res_200',
          'res_1000',
          'res_2000',
          'on_idle',
        ])
      })

      it('emits an error event if the value pumped is not an array', async () => {
        return test.testInput('flatten', null, [
          1,
          [10, 20],
          100,
          [1000, 2000],
        ], [
          'on_busy',
          'err_Expected an array; found: number',
          'res_10',
          'err_Expected an array; found: number',
          'res_20',
          'res_1000',
          'res_2000',
          'on_idle',
        ])
      })
    })

    describe('MoonPipe.map', () => {
      it('emits an onData event for every item in the array', async () => {
        return test.testInput('map', val =>  val * 2, [
          1,
          2,
          3,
          4,
        ], [
          'on_busy',
          'res_2',
          'res_4',
          'res_6',
          'res_8',
          'on_idle',
        ])
      })

      it('emits an onError event when the function throws', async () => {
        return test.testInput('map', () => { throw new Error('wrong') }, [
          1,
          2,
          3,
          4,
        ], [
          'on_busy',
          'err_wrong',
          'err_wrong',
          'err_wrong',
          'err_wrong',
          'on_idle',
        ])
      })
    })

    describe('MoonPipe.filter', () => {
      it('emits an onData event for every item in the array', async () => {
        return test.testInput('filter', val => val % 2, [
          1,
          1,
          2,
          2,
          3,
          3,
          4,
          4,
        ], [
          'on_busy',
          'res_1',
          'res_1',
          'res_3',
          'res_3',
          'on_idle',
        ])
      })

      it('emits an onError event when the function throws', async () => {
        return test.testInput('filter', () => { throw new Error('zonk') }, [
          1,
          2,
          3,
          4,
        ], [
          'on_busy',
          'err_zonk',
          'err_zonk',
          'err_zonk',
          'err_zonk',
          'on_idle',
        ])
      })
    })
  })

  describe('poolSize = 2, classify % 1', () => {
    let counter = 0
    const test = new Test(2, () => ++counter % 1)

    describe('MoonPipe.flatten', () => {
      it('emits an onData event for every item in the array', async () => {
        return test.testInput('flatten', null, [
          [1, 2],
          [10, 20],
          [100, 200],
          [1000, 2000],
        ], [
          'on_busy',
          'res_1',
          'res_2',
          'res_10',
          'res_20',
          'res_100',
          'res_200',
          'res_1000',
          'res_2000',
          'on_idle',
        ])
      })

      it('emits an error event if the value pumped is not an array', async () => {
        return test.testInput('flatten', null, [
          1,
          [10, 20],
          100,
          [1000, 2000],
        ], [
          'on_busy',
          'err_Expected an array; found: number',
          'res_10',
          'err_Expected an array; found: number',
          'res_20',
          'res_1000',
          'res_2000',
          'on_idle',
        ])
      })
    })

    describe('MoonPipe.map', () => {
      it('emits an onData event for every item in the array', async () => {
        return test.testInput('map', val =>  val * 2, [
          1,
          2,
          3,
          4,
        ], [
          'on_busy',
          'res_2',
          'res_4',
          'res_6',
          'res_8',
          'on_idle',
        ])
      })

      it('emits an onError event when the function throws', async () => {
        return test.testInput('map', () => { throw new Error('wrong') }, [
          1,
          2,
          3,
          4,
        ], [
          'on_busy',
          'err_wrong',
          'err_wrong',
          'err_wrong',
          'err_wrong',
          'on_idle',
        ])
      })
    })

    describe('MoonPipe.filter', () => {
      it('emits an onData event for every item in the array', async () => {
        return test.testInput('filter', val => val % 2, [
          1,
          1,
          2,
          2,
          3,
          3,
          4,
          4,
        ], [
          'on_busy',
          'res_1',
          'res_1',
          'res_3',
          'res_3',
          'on_idle',
        ])
      })

      it('emits an onError event when the function throws', async () => {
        return test.testInput('filter', () => { throw new Error('zonk') }, [
          1,
          2,
          3,
          4,
        ], [
          'on_busy',
          'err_zonk',
          'err_zonk',
          'err_zonk',
          'err_zonk',
          'on_idle',
        ])
      })
    })
  })

  describe('poolSize = 2, classify % 2', () => {
    let counter = 0
    const test = new Test(2, () => ++counter % 2)

    describe('MoonPipe.flatten', () => {
      it('emits an onData event for every item in the array', async () => {
        return test.testInput('flatten', null, [
          [1, 2],
          [10, 20],
          [100, 200],
          [1000, 2000],
        ], [
          'on_busy',
          'res_1',
          'res_2',
          'res_10',
          'res_20',
          'res_100',
          'res_200',
          'res_1000',
          'res_2000',
          'on_idle',
        ])
      })

      it('emits an error event if the value pumped is not an array', async () => {
        return test.testInput('flatten', null, [
          1,
          [10, 20],
          100,
          [1000, 2000],
        ], [
          'on_busy',
          'err_Expected an array; found: number',
          'res_10',
          'err_Expected an array; found: number',
          'res_20',
          'res_1000',
          'res_2000',
          'on_idle',
        ])
      })
    })

    describe('MoonPipe.map', () => {
      it('emits an onData event for every item in the array', async () => {
        return test.testInput('map', val =>  val * 2, [
          1,
          2,
          3,
          4,
        ], [
          'on_busy',
          'res_2',
          'res_4',
          'res_6',
          'res_8',
          'on_idle',
        ])
      })

      it('emits an onError event when the function throws', async () => {
        return test.testInput('map', () => { throw new Error('wrong') }, [
          1,
          2,
          3,
          4,
        ], [
          'on_busy',
          'err_wrong',
          'err_wrong',
          'err_wrong',
          'err_wrong',
          'on_idle',
        ])
      })
    })

    describe('MoonPipe.filter', () => {
      it('emits an onData event for every item in the array', async () => {
        return test.testInput('filter', val => val % 2, [
          1,
          1,
          2,
          2,
          3,
          3,
          4,
          4,
        ], [
          'on_busy',
          'res_1',
          'res_1',
          'res_3',
          'res_3',
          'on_idle',
        ])
      })

      it('emits an onError event when the function throws', async () => {
        return test.testInput('filter', () => { throw new Error('zonk') }, [
          1,
          2,
          3,
          4,
        ], [
          'on_busy',
          'err_zonk',
          'err_zonk',
          'err_zonk',
          'err_zonk',
          'on_idle',
        ])
      })
    })
  })
})
