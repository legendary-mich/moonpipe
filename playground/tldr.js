'use strict'

const { MudPipe } = require('../index.js')
const { delayPromise } = require('../test/utils.js')

const mp = new MudPipe()
  .cancelLazy(1000) // in other libs known as debounce
  .queueMap(async (val) => 'initial_' + val)
  .queueTap(async (val) => {
    console.log('output:', val)
    throw 'thrown in queueTap'
  })
  .queueError(async (err) => {
    console.log('error:', err)
  })

mp.pump('a')
mp.pump('b')
mp.pump('c')
mp.pump('d')
