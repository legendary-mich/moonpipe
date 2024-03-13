'use strict'

const unhandledCallback = (reason) => { throw reason }

before(() => {
  process.on('unhandledRejection', unhandledCallback)
})

after(() => {
  process.off('unhandledRejection', unhandledCallback)
})
