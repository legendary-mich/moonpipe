'use strict'

const { MoonPipe, delayPromise } = require('../index.js')

async function runValve(valveName) {
  const startTime = Date.now()
  console.log('// .%s(() => val.toUpperCase())', valveName)
  const mp = new MoonPipe()[valveName](async (val) => {
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
    'queueTap',
    'queueMap',
    'skipTap',
    'skipMap',
    'throttleTap',
    'throttleMap',
    'cancelTap',
    'cancelMap',
  ]
  for (const name of valveNames) {
    await runValve(name)
  }
}
main()
