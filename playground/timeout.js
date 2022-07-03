'use strict'

const { MudPipe } = require('../index.js')
const { delayPromise } = require('../test/utils.js')

const mp = new MudPipe()
  .queueTap(async () => {
    await delayPromise(3)
  }, {
    timeoutMs: 1, // <---------- timeout is enabled HERE
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })
  .queueError(async (err) => {
    console.log('error:', err.message)
  })

mp.pump('a')
