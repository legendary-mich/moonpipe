'use strict'

const { MoonPipe } = require('../index.js')

const mp = new MoonPipe()
  .queueLazy(0)
  .cancelTap(async (val, promiseContext) => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('// greetings from the timeout:', val)
        resolve()
      }, 1000)

      promiseContext.onCancel = () => { // <---------- HERE
        console.log('// clearing:', val)
        clearTimeout(timeout)
      }
    })
  })
  .queueTap(async (val) => {
    console.log('// output:', val)
  })

mp.pump('a')
mp.pump('b')
mp.pump('c')
mp.pump('d')
