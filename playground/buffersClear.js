'use strict'

const { MoonPipe } = require('../index.js')

const mp = new MoonPipe()
  .cancelLazy(1000)             // valveIndex = 0
  .queueMap(async (val) => val) // valveIndex = 1
  .queueTap(async (val) => {    // valveIndex = 2
    throw 'thrown in queueTap'
  })
  .queueError(async (err) => {  // valveIndex = 3
    console.log('error:', err)
  })

mp.buffersClearOne(1) // this will clear out the buffer in the queueMap valve
mp.buffersClearAll() // this will clear out buffers in all the valves
