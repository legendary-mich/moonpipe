'use strict'

const { MoonPipe } = require('../index.js')

const mp = new MoonPipe()
  .queueMap(async (val) => {
    return 'mapped_' + val
  }, {
    poolSize: 2, // <----- poolSize is increased HERE
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump('a')
mp.pump('b')
mp.pump('c')
