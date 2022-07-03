'use strict'

const { MudPipe } = require('../index.js')
const { delayPromise } = require('../test/utils.js')

const mp = new MudPipe()
  .queueMap(async (val) => {
    console.log('...side effect')
    return 'mapped_' + val
  }, {
    cache: true, // <------ cache is enabled HERE
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump('a')
mp.pump('b')
mp.pump('a')
