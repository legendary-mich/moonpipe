'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(method, expected) {
  const results = []
  const pipe = new MoonPipe()
    .onBusyTap((value) => {
      results.push('on_busy_' + value)
    })
    .onIdle((value) => {
      results.push('on_idle_' + value)
    })

  pipe.pump(1)
  pipe.pump(2)
  pipe.pump(3)

  await delayPromise(16)
  expect(results).to.eql(expected)
}

describe('Hooks.NoValves with Synchronous input.', () => {

  describe('When there are no valves attached', () => {
    it('the onIdle callback still gets called', () => {
      return testInput('onBusyTap', [
        'on_busy_1',
        'on_idle_undefined',
        'on_busy_2',
        'on_idle_undefined',
        'on_busy_3',
        'on_idle_undefined',
      ])
    })
  })
})
