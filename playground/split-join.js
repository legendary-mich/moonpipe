'use strict'

const { MoonPipe } = require('../index.js')

const mp = new MoonPipe()
  .splitBy(2, value => value.id)     //  /\
  .throttleMap(async value => value) //  ||
  .join()                            //  \/
  .queueTap(value => {
    console.log('//', value)
  })

console.log('// output:')
mp.pump({ id: 1, n: 'start' })
mp.pump({ id: 1, n: 'middle' })
mp.pump({ id: 1, n: 'end' })
mp.pump({ id: 2, n: 'start' })
mp.pump({ id: 2, n: 'middle' })
mp.pump({ id: 2, n: 'end' })

// output:
// { id: 1, n: 'start' }
// { id: 2, n: 'start' }
// { id: 1, n: 'end' }
// { id: 2, n: 'end' }
