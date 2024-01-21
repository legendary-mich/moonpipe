'use strict'

const { MoonPipe } = require('../index.js')
const mp = new MoonPipe()
  // time-based valves take a number of milliseconds as the first argument
  .queueLazy(300)
  // promise-based valves take a function which returns a promise
  .queueMap(async (val) => val + 1000)
  // errors thrown from any of the promise-based valves are
  // propagated through the error channel to the first error handler.
  .queueTap(async (val) => { if (val === 'what?1000') throw new Error('I did not expect that!') })
  // the filter valve takes a function which returns a `boolean` value
  .filter((val) => val % 2 === 0)
  // the map valve takes a function which returns an arbitrary value
  .map((val) => [val, val])
  // the flatten valve does not take any arguments
  .flatten()
  // error valves take a function which returns a promise
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
// output: error handled: I did not expect that!
// output: 1004
// output: 1004
