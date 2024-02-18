'use strict'

const { MoonPipe, ConstantBackoff, LinearBackoff } = require('../index.js')
const mp = new MoonPipe()
  .queueTap(async (val) => {
    console.log('// side:', val)
    throw 'err_' + val
  }, {
    repeatPredicate: (attemptsMade, err) => {
      return attemptsMade <= 3 && err === 'err_b'
    },
    // repeatBackoffFactory: () => new ConstantBackoff(1000), // OPTIONAL
    // repeatBackoffFactory: () => new LinearBackoff(1000), // OPTIONAL
    // repeatBackoffFactory: () => new ConstantBackoff(0), // OPTIONAL DEFAULT
  })
  .queueError(async (err) => {
    console.log('// error:', err)
  })

mp.pump('a')
mp.pump('b')
mp.pump('c')
