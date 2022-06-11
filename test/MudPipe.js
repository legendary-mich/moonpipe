'use strict'

const { expect } = require('chai')
const {
  MudPipe,
  BaseValve,
  BasePresets,
} = require('../index.js')

describe('MudPipe', () => {

  describe('pipe', () => {
    it('throws for a missing valve', () => {
      const mudPipe = new MudPipe()
      try {
        mudPipe.pipe()
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected 'valve' to derive from (or be an instance of) a 'BaseValve'")
      }
    })

    it('throws for a valve which is not an instance of BaseValve', () => {
      const mudPipe = new MudPipe()
      try {
        mudPipe.pipe(2)
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected 'valve' to derive from (or be an instance of) a 'BaseValve'")
      }
    })

    it('throws for a channel which is outside of the enum range', () => {
      const mudPipe = new MudPipe()
      try {
        mudPipe.pipe(new BaseValve(BasePresets.queue), 'haha')
      }
      catch (err) {
        expect(err).to.have.property('message', "Unexpected 'channel' name: haha")
      }
    })
  })
})
