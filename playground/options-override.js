'use strict'

const { MudPipe } = require('../index.js')

const mp = new MudPipe()
  .throttleMap(async (val) => 'initial_' + val, {
    maxBufferSize: 2, // <---- overridden HERE
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump('a')
mp.pump('b')
mp.pump('c')
mp.pump('d')
