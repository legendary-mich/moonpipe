'use strict'

const { MoonPipe, delayPromise } = require('../index.js')

async function runValve(valveName) {
  const startTime = Date.now()
  const valveDelay = 1000
  const sliceSize = 3
  console.log('// .%s(%s, %s)', valveName, sliceSize, valveDelay)
  const mp = new MoonPipe()[valveName](sliceSize, valveDelay)
    .queueTap((val) => {
      console.log('// out: %s, time: %s', val, Date.now() - startTime)
    })

  mp.pump('A')
  mp.pump('B')
  await delayPromise(500)
  mp.pump('C')
  await delayPromise(valveDelay * 3)
  console.log()
}

async function main() {
  const valveNames = [
    'sliceEager',
    'sliceLazy',
  ]
  for (const name of valveNames) {
    await runValve(name)
  }
}
main()
