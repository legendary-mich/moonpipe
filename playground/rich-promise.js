'use strict'

const { MoonPipe, delayPromise } = require('../index.js')

const {
  RichPromise,
  PROMISE_RESOLVE_TYPE,
  TimeoutError,
} = require('../lib/RichPromise.js')

const newPromise = new RichPromise(
  // () => delayPromise(4000),
  async (val, context) => {
    let a = Math.floor(Math.random() * 100)
    context.onCancel = () => {
      console.log('cancel a:', a)
    }
    console.log('waiting a:', a)
    await delayPromise(1000)
    throw new Error('ho')
  },
  PROMISE_RESOLVE_TYPE.MAP,
  0, //  timeoutMs
  // () => true // repeat predicate
  (attemptsMade) => attemptsMade < 3 // repeat predicate
)

async function main() {
  // await newPromise.run(100)
  newPromise.run(100)
  await delayPromise(2500)
  newPromise.cancel()
}

main()
