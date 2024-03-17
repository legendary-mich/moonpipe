'use strict'

const { MoonPipe } = require('../index.js')

const mp = new MoonPipe()
  .queueTap(val => console.log('// out: ', val))

mp.pump('echo')
mp.rePumpLast() // <--- HERE
// out:  echo
// out:  echo
