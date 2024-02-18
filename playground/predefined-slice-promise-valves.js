'use strict'

const { MoonPipe, delayPromise } = require('../index.js')

async function runValve(valveName) {
  const startTime = Date.now()
  const sliceSize = 3
  console.log('// .%s(%s, () => val.toUpperCase())', valveName, sliceSize)
  const mp = new MoonPipe()[valveName](sliceSize, async (val) => {
    console.log('// side: %s, time: %s', val, Date.now() - startTime)
    await delayPromise(6)
    return val.toUpperCase()
  })
    .queueTap((val) => {
      console.log('// out : %s, time: %s', val, Date.now() - startTime)
    })

  mp.pump('a')
  mp.pump('b')
  mp.pump('c')

  await delayPromise(20)
  console.log()
}

async function main() {
  const valveNames = [
    'sliceTap',
    'sliceMap',
  ]
  for (const name of valveNames) {
    await runValve(name)
  }
}
main()
