'use strict'

const { MoonPipe } = require('../index.js')
const mp = new MoonPipe()
  .queueTap(async (val) => {
    throw val
  })
  .filterError(err => err.message !== 'haha')
  .queueError(async (err) => 'error handled: ' + err.message)
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump(new Error('bobo'))
mp.pump(new Error('haha'))
mp.pump(new Error('zozo'))
