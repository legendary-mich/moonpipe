'use strict'

// A typical setup for converting user input into http GET requests.
// For PUT requests use throttleMap in place of the cancelMap.
const { MoonPipe } = require('../index.js')
const mp = new MoonPipe()
  .onBusy(() => console.log('// loading'))
  .cancelLazy(1000) // in other libs known as debounce
  .cancelMap(async (val) => 'initial_' + val) // a GET request goes here
  .queueTap(async (val) => console.log('// output:', val))
  .queueError(async (err) => console.log('// error:', err))
  .onIdle(() => console.log('// done'))

mp.pump('a')
mp.pump('b')
mp.pump('c')
mp.pump('d')

// loading
// output: initial_d
// done
