'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method) {
  const poolSize = 5
  const promiseDelay = 2
  const results = []
  let counter = 0
  const pipe = new MoonPipe()[method](poolSize, async (value) => {
    await delayPromise(promiseDelay)
    if (counter++ === 0) {
      // Throwing an error so that the pipe switches to the `error
      // mode`, and stops calling next() on the pool valve. The
      // assumption is that after the pipe recovers from the error,
      // the pool valve should resume at its full capacity.
      throw new Error(value + 100)
    }
    else {
      return value + 100
    }
  })
    .queueTap(async (value) => {
      results.push('res_' + value)
    })
    .queueError(async (err) => {
      // Wait longer than it takes for a promise in the pool to
      // settle, so that all of the promises manage to be evicted from
      // the pool before the pipe switches back to the `data mode`.
      await delayPromise(promiseDelay * 2)
      results.push('err_' + err.message)
    })

  const dataSize = 1000
  for (let i=0; i<dataSize; ++i) {
    pipe.pump(1)
  }
  const delay = dataSize / poolSize * (promiseDelay + 1)
  await delayPromise(delay)
  expect(results).to.have.lengthOf(dataSize)
  expect(results[0]).to.eql('err_101')
}

describe('PromiseValves.Pool.Load.Test.js', () => {

  describe('MoonPipe.poolTap', () => {
    it('runs the pool at its full capacity', () => {
      return testInput('poolTap')
    })
  })

  describe('MoonPipe.poolMap', () => {
    it('runs the pool at its full capacity', () => {
      return testInput('poolMap')
    })
  })
})
