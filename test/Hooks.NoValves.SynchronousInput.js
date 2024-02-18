'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

async function testInput(expected) {
  const results = []
  const pipe = new MoonPipe()
    .onBusyTap((value) => {
      results.push('on_busy_tap_' + value)
    })
    .onBusy(() => {
      results.push('on_busy')
    })
    .onIdle(() => {
      results.push('on_idle')
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
      return testInput([
        'on_busy_tap_1',
        'on_busy',
        'on_idle',
        'on_busy_tap_2',
        'on_busy',
        'on_idle',
        'on_busy_tap_3',
        'on_busy',
        'on_idle',
      ])
    })
  })
})
