'use strict'

const { MoonPipe } = require('../index.js')
const mp = new MoonPipe()
  // slice operators take the sliceSize as the first argument and a
  // promise as the second one.
  .sliceMap(3, async (val) => val)
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump(1)
mp.pump(2)
mp.pump(3)
mp.pump(4)

// output: [ 1, 2, 3 ]
// output: [ 4 ]
