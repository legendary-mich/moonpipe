'use strict'

const { MoonPipe } = require('../index.js')

const mp = new MoonPipe()
  .onBusy(() => {
    console.log('is loading')
  })
  .onIdle(() => {
    console.log('is NOT loading anymore')
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump(1)
mp.pump(2)
