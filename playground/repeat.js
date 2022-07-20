'use strict'

const { MoonPipe } = require('../index.js')

const mp = new MoonPipe()
  .queueTap(async (val) => {
    console.log('// output:', val)
    throw 'err_' + val
  }, {
    repeatPredicate: async (attemptsMade, err) => {
      return attemptsMade <= 3 && err === 'err_b'
    },
  })
  .queueError(async (err) => {
    console.log('// error:', err)
  })

mp.pump('a')
mp.pump('b')
mp.pump('c')
