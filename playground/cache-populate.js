'use strict'

const { MoonPipe } = require('../index.js')

const mp = new MoonPipe()
  .queueMap(async (val) => 'mapped_' + val, {
    cache: true,
    name: 'bigJohn',
  })
  .queueTap(async (val) => {
    console.log('// output:', val)
  })

mp.cachePopulate('bigJohn', 'a', 'zzz')
mp.pump('a')
mp.pump('b')

// output: zzz
// output: mapped_b
