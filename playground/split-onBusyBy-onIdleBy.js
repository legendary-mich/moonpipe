'use strict'

const { MoonPipe } = require('../index.js')

const mp = new MoonPipe()
  .splitBy(2, value => value.color)
  .onBusyBy(color => {
    console.log('// onBusyBy', color)
  })
  .throttleMap(async value => value)
  .onIdleBy(color => {
    console.log('// onIdleBy', color)
  })
  .join()
  .queueTap(value => {
    console.log('//', value)
  })

console.log('// output:')
mp.pump({ color: 'green', n: 'start' })
mp.pump({ color: 'green', n: 'middle' })
mp.pump({ color: 'green', n: 'end' })
mp.pump({ color: 'reeed', n: 'start' })
mp.pump({ color: 'reeed', n: 'middle' })
mp.pump({ color: 'reeed', n: 'end' })

// output:
// onBusyBy green
// onBusyBy reeed
// { color: 'green', n: 'start' }
// { color: 'reeed', n: 'start' }
// onIdleBy green
// onIdleBy reeed
// { color: 'green', n: 'end' }
// { color: 'reeed', n: 'end' }
