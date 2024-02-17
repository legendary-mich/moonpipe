'use strict'

const {
  MoonPipe,
  PromiseValve,
  PROMISE_RESOLVE_TYPE,
  CHANNEL_TYPE,
  BUFFER_TYPE,
  OVERFLOW_ACTION,
  ConstantBackoff,
} = require('../index.js')

const preset = {
  name: null,
  maxBufferSize: 3,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.SHIFT,
  outputChannel: CHANNEL_TYPE.DATA,
  resolveType: PROMISE_RESOLVE_TYPE.MAP,
  cancelOnPump: false,
  timeoutMs: 0,
  poolSize: 1,
  cache: false,
  hashFunction: value => value,
  repeatPredicate: () => false,
  repeatBackoffFactory: () => new ConstantBackoff(0),
}

const customTimeValve = new PromiseValve(preset, val => val.toUpperCase())

const mp = new MoonPipe()
  .pipe(customTimeValve) // <-- your custom valve is plugged in HERE
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump('a')
mp.pump('b')
mp.pump('c')
mp.pump('d')
mp.pump('e')

// output: A
// output: D
// output: E
