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
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected 'valve' to derive from (or be an instance of) a 'BaseValve'")
      }
    })

    it('throws for a valve which is not an instance of BaseValve', () => {
      const mudPipe = new MudPipe()
      try {
        mudPipe.pipe(2)
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected 'valve' to derive from (or be an instance of) a 'BaseValve'")
      }
    })

    it('throws for a channel which is outside of the enum range', () => {
      const mudPipe = new MudPipe()
      try {
        mudPipe.pipe(new BaseValve(BasePresets.queue), 'haha')
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Unexpected 'channel' name: haha")
      }
    })
  })

  describe('buffersClearOne', () => {
    it('throws for a missing valveIndex', () => {
      const mudPipe = new MudPipe()
      try {
        mudPipe.buffersClearOne()
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected valveIndex to be a 'number' greater than 0 and smaller than 0; found: undefined")
      }
    })

    it('throws for valveIndex lower than 0', () => {
      const mudPipe = new MudPipe().queueLazy(1)
      try {
        mudPipe.buffersClearOne(-1)
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected valveIndex to be a 'number' greater than 0 and smaller than 1; found: -1")
      }
    })

    it('throws for valveIndex greater than the max index', () => {
      const mudPipe = new MudPipe().queueLazy(1).queueLazy(1)
      try {
        mudPipe.buffersClearOne(2)
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected valveIndex to be a 'number' greater than 0 and smaller than 2; found: 2")
      }
    })
  })

  describe('cacheClearOne', () => {
    it('throws for a missing valveIndex', () => {
      const mudPipe = new MudPipe()
      try {
        mudPipe.cacheClearOne()
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected valveIndex to be a 'number' greater than 0 and smaller than 0; found: undefined")
      }
    })

    it('throws for valveIndex lower than 0', () => {
      const mudPipe = new MudPipe().queueLazy(1)
      try {
        mudPipe.cacheClearOne(-1)
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected valveIndex to be a 'number' greater than 0 and smaller than 1; found: -1")
      }
    })

    it('throws for valveIndex greater than the max index', () => {
      const mudPipe = new MudPipe().queueLazy(1).queueLazy(1)
      try {
        mudPipe.cacheClearOne(2)
        throw new Error('should have thrown')
      }
      catch (err) {
        expect(err).to.have.property('message', "Expected valveIndex to be a 'number' greater than 0 and smaller than 2; found: 2")
      }
    })
  })
})
