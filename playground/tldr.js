'use strict'

const { MudPipe } = require('../index.js')
const { delayPromise } = require('../test/utils.js')

const mp = new MudPipe()
  .cancelLazy(1000) // in other libs known as debounce
  .queueMap(async (val) => 'initial_' + val)
  .queueTap(async (val) => {
    console.log('output:', val)
    throw 'thrown somewhere else'
  })
  .handleError(async (err) => {
    console.log('error:', err)
  })

mp.pump('a')
mp.pump('b')
mp.pump('c')
mp.pump('d')

// async function run() {
//   mp.pump('a')
//   await delayPromise(900)
//   mp.pump('b')
//   await delayPromise(900)
//   mp.pump('c')
//   await delayPromise(900)
//   mp.pump('d')
// }

// run()
