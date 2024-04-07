'use strict'

const { MoonPipe } = require('../index.js')

async function example() {
  const mp = new MoonPipe().queueTap(() => {})
  mp.pump(1)
  await mp.getOnIdlePromise()
}

async function main() {
  const m1 = new MoonPipe()
    .queueTap((val) => console.log('m1:', val))
  const m2 = new MoonPipe()
    .queueTap((val) => console.log('m2:', val))

  m1.pump(1)
  m1.pump(2)
  m1.pump(3)

  await m1.getOnIdlePromise()
  // m1.getOnIdlePromise()

  m2.pump(1)
  m2.pump(2)
  m2.pump(3)

  await example()
}

main()
