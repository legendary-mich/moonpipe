'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](async (value) => {
    const string = `${value.i}_${value.op}`
    results.push('side_' + string)
    await delayPromise(1)
    return {...value, i: value.i + 10}
  }, {
    squashDownTo: (value) => {
      const string = `${value.i}_${value.op}`
      throw new Error(`squash_err_${string}`)
    },
  })
    .queueTap(async (value) => {
      const string = `${value.i}_${value.op}`
      results.push('res_' + string)
    })
    .queueError(async (err) => {
      results.push('err_' + err.message)
    })
    .onBusy(() => {
      results.push('on_busy')
    })
    .onIdle(() => {
      results.push('on_idle')
    })

  pipe.pump({i: 0, op: 'post'})
  pipe.pump({i: 1, op: 'put'})
  pipe.pump({i: 2, op: 'put'})
  pipe.pump({i: 3, op: 'del'})
  pipe.pump({i: 4, op: 'post'})
  pipe.pump({i: 5, op: 'put'})
  pipe.pump({i: 6, op: 'put'})
  pipe.pump({i: 7, op: 'del'})

  await delayPromise(16)
  expect(results).to.eql(expected)
}

describe('PromiseValves.SquashDownTo.Throws', () => {

  describe('MoonPipe.queueMap', () => {
    it('pumps errors to the next error valve in line', () => {
      return testInput('queueMap', [
        'on_busy',
        'err_squash_err_0_post',
        'err_squash_err_1_put',
        'err_squash_err_2_put',
        'err_squash_err_3_del',
        'err_squash_err_4_post',
        'err_squash_err_5_put',
        'err_squash_err_6_put',
        'err_squash_err_7_del',
        'on_idle',
      ])
    })
  })
})
