'use strict'

const { MoonPipe } = require('../index.js')
const mp = new MoonPipe()
  // time-based operators take a number of milliseconds as the first argument
  .queueLazy(300)
  // promise-based operators take a function which returns a promise
  .queueMap(async (val) => val + 1000)
  // errors thrown from any of the promise-based operators are
  // propagated through the error channel to the first error handler.
  .queueTap(async (val) => { if (val === 'what?1000') throw new Error('ha!') })
  // the filter operator takes a function which returns a `boolean` value
  .filter((val) => val % 2 === 0)
  // the map operator takes a function which returns an arbitrary value
  .map((val) => [val, val])
  // the flatten operator does not take any arguments
  .flatten()
  // error operators take a function which returns a promise
  .queueError(async (err) => 'error handled: ' + err.message)
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump(1)
mp.pump(2)
mp.pump('what?')
mp.pump(3)
mp.pump(4)

// output: 1002
// output: 1002
// output: error handled: ha!
// output: 1004
// output: 1004
