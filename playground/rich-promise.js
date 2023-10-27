'use strict'

const { MoonPipe, delayPromise } = require('../index.js')

const {
  RichPromise,
  PROMISE_RESOLVE_TYPE,
  TimeoutError,
} = require('../lib/RichPromise.js')

const newPromise = new RichPromise(
  {
    resolveType: PROMISE_RESOLVE_TYPE.MAP,
    timeoutMs: 0,
    // repeatPredicate: () => true,
    repeatPredicate: (attemptsMade) => attemptsMade < 3,
  },
  // () => delayPromise(4000),
  async (val, context) => {
    let a = Math.floor(Math.random() * 100)
    context.onCancel = () => {
      console.log('cancel a:', a)
    }
    console.log('waiting a:', a)
    await delayPromise(1000)
    throw new Error('ho')
  }
)

async function main() {
  // await newPromise.run(100)
  newPromise.run(100)
  await delayPromise(2500)
  newPromise.cancel()
}

main()
