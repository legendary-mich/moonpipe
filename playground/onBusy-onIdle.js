'use strict'

const { MoonPipe } = require('../index.js')

const mp = new MoonPipe()
  .onBusyTap((value) => {
    console.log('is loading', value)
  })
  .onIdle(() => {
    console.log('is NOT loading anymore')
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump(1)
mp.pump(2)
