'use strict'

const {
  MudPipe,
  TimeValve,
  TIME_RESOLVE_TYPE,
  BUFFER_TYPE,
  OVERFLOW_ACTION
} = require('../index.js')
const { delayPromise } = require('../test/utils.js')

const preset = {
  maxBufferSize: 3,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.SHIFT,
  resolveType: TIME_RESOLVE_TYPE.LAZY,
  cancelOnPump: false,
}
const customTimeValve = new TimeValve(preset, 1000)
const mp = new MudPipe()
  .pipe(customTimeValve)
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump('a')
mp.pump('b')
mp.pump('c')
mp.pump('d')
mp.pump('e')
