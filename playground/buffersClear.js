'use strict'

const { MoonPipe } = require('../index.js')

const mp = new MoonPipe()
  .cancelLazy(1000)              // valveIndex = 0
  .queueMap(async (val) => val)  // valveIndex = 1
  .splitBy(1, () => 'whatever')  // valveIndex = 2
  .queueTap(async (val) => val)  // valveIndex = 3
  .queueTap(async (val) => val)  // valveIndex = 4
  .join()
  .queueError(async (err) => {}) // valveIndex = 5

mp.buffersClearOne(1) // this will clear out the buffer in the queueMap valve
mp.buffersClearOne(2) // this will clear out everything that's between splitBy() and join()
mp.buffersClearOne(3) // this will clear out the buffer in the first queueTap valve
mp.buffersClearAll()  // this will clear out buffers in all the valves
