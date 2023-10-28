'use strict'

const { MoonPipe } = require('../index.js')

const mp = new MoonPipe()
  .cancelLazy(1000, {name: 'cl'})
  .queueMap(async (val) => val, {name: 'qm'})
  .splitBy(1, () => 'whatever', {name: 'splitter'})
  .queueTap(async (val) => val, {name: 'qt'})
  .queueTap(async (val) => val)
  .join()
  .queueError(async (err) => {})

mp.buffersClearOne('qm') // this will clear out the buffer in the valve named 'qm'
mp.buffersClearOne('splitter') // this will clear out everything that's between splitBy() and join()
mp.buffersClearOne('qt') // this will clear out the buffer in the valve named 'qt'
mp.buffersClearAll()  // this will clear out buffers in all the valves
