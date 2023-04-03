'use strict'

const { MoonPipe, delayPromise } = require('../index.js')

let counter = 0
const mp = new MoonPipe()
  .cancelEager(10)
  .queueMap(async (val) => 'initial_' + val)
  .queueTap(async (val) => {
    console.log('output:', val)
    // mp.pump(++counter)
  })
  .onIdle(() => console.log('on idle'))

async function run() {
  mp.pump(++counter)
  mp.pump(++counter)
  await delayPromise(2000)
  mp.pump(++counter)
  mp.pump(++counter)
  await delayPromise(2000)
  mp.pump(++counter)
  mp.pump(++counter)
  await delayPromise(2000)
  mp.pump(++counter)
  mp.pump(++counter)
  await delayPromise(2000)
  mp.pump(++counter)
  mp.pump(++counter)
}
run()
