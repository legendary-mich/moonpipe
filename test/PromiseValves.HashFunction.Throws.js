'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()[method](async (value) => {
    results.push('side_' + value)
    return value + 100
  }, {
    cache: true,
    hashFunction: () => { throw new Error('holo') },
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      results.push('err_' + err.message)
    })

  pipe.pump(1)
  await delayPromise(5)
  expect(results).to.eql(expected)
}

describe('PromiseValves.HashFunction.Throws.js', () => {

  describe('MoonPipe.queueTap', () => {
    it('catches an error thrown by the hash function', () => {
      return testInput('queueTap', [
        'err_holo',
      ])
    })
  })
})
