'use strict'

const { MoonPipe } = require('../index.js')

// const mp = new MoonPipe()
//   .filter(val => val % 2 === 0)
//   .queueTap(val => console.log('// out: ', val))

const mp = new MoonPipe()
  .map(val => val % 2 === 0)
  .queueTap(val => console.log('// out: ', val))

mp.pump(1)
mp.pump(2)
mp.pump(3)
mp.pump(4)

// const mp = new MoonPipe()
//   .flatten()
//   .queueTap(val => console.log('// out: ', val))

// mp.pump([1, 2])
