'use strict'

const { MoonPipe } = require('../index.js')
const mp = new MoonPipe()
  .queueMap(async (val) => {
    return `mapped ${val.op} ${val.i}`
  }, {
    squashDownTo: (val) => val.op, // <------- HERE
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump({op: 'post', i: 0}) // processed right away
mp.pump({op: 'put ', i: 1}) // removed by i:2
mp.pump({op: 'put ', i: 2}) // removed by i:5
mp.pump({op: 'del ', i: 3}) // removed by i:5
mp.pump({op: 'post', i: 4}) // removed by i:5
mp.pump({op: 'put ', i: 5}) // removed by i:6
mp.pump({op: 'put ', i: 6})
mp.pump({op: 'del ', i: 7})

// output: mapped post 0
// output: mapped put  6
// output: mapped del  7
