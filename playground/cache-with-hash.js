'use strict'

const { MoonPipe } = require('../index.js')

const mp = new MoonPipe()
  .queueMap(async (val) => {
    console.log('...side effect')
    return 'mapped_' + val
  }, {
    cache: true,
    hashFunction: (val) => val.toLowerCase(), // results will be stored at val.toLowerCase()
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump('A')
mp.pump('a')
