'use strict'

const { MudPipe } = require('../index.js')
const { delayPromise } = require('../test/utils.js')

const mp = new MudPipe()
  .queueTap(async (val) => {
    console.log('output:', val)
    throw 'err_' + val
  }, {
    repeatOnError: 3,
    repeatPredicate: async (err) => err === 'err_b',
  })
  .queueError(async (err) => {
    console.log('error:', err)
  })

mp.pump('a')
mp.pump('b')
mp.pump('c')
