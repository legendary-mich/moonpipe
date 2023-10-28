'use strict'

const { MoonPipe } = require('../index.js')

const mp = new MoonPipe()
  .queueMap(async (val) => {
    console.log('...side effect')
    return 'mapped_' + val
  }, {
    cache: true, // <------ cache is enabled HERE
    name: 'bigJohn', // <-- a name that you can use to wipe out the cache in this particular valve
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump('a')
mp.pump('b')
mp.pump('a')
