'use strict'

const { MoonPipe } = require('../index.js')

const mp = new MoonPipe()
  .splitBy(2, value => value.id)     //  /\
  .throttleMap(async value => value) //  ||
  .join()                            //  \/
  .queueTap(value => {
    console.log('// queue   ', value)
  })

mp.pump({ id: 1, n: 'a' })
mp.pump({ id: 1, n: 'b' })
mp.pump({ id: 1, n: 'c' })
mp.pump({ id: 2, n: 'e' })
mp.pump({ id: 2, n: 'f' })
mp.pump({ id: 2, n: 'g' })
