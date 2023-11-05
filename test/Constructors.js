'use strict'

const { expect } = require('chai')
const {
  BUFFER_TYPE,
  OVERFLOW_ACTION,
  TIME_RESOLVE_TYPE,
  PROMISE_RESOLVE_TYPE,
  BaseValve,
  TimeValve,
  PromiseValve,
  FlattenValve,
  MapValve,
  FilterValve,
  Splitter,
} = require('../index.js')

function baseValveAssertions(TargetClass) {

  const properBaseValvePreset = {
    name: null,
    bufferType: BUFFER_TYPE.QUEUE,
    maxBufferSize: 1000,
    overflowAction: OVERFLOW_ACTION.SHIFT,
  }

  it('throws for a preset which is not an object', () => {
    const preset = 2
    try {
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Expected 'preset' to be an 'object'")
    }
  })

  it('throws for a name other than string or null', () => {
    try {
      const preset = Object.assign({}, properBaseValvePreset, {
        name: 300,
      })
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Expected the 'name' to be either a 'string' or 'null'; found: 300")
    }
  })

  it('throws for an unknown bufferType', () => {
    const preset = Object.assign({}, properBaseValvePreset, {
      bufferType: 'shock',
    })
    try {
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Unexpected 'bufferType': shock")
    }
  })

  it('throws for an unknown overflowAction', () => {
    const preset = Object.assign({}, properBaseValvePreset, {
      overflowAction: 'whatever',
    })
    try {
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Unexpected 'overflowAction': whatever")
    }
  })

  it('throws for an unknown maxBufferSize', () => {
    const preset = Object.assign({}, properBaseValvePreset, {
      maxBufferSize: 'one',
    })
    try {
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Expected maxBufferSize to be a 'number' greater than -1 and lower than 4294967296; found: one")
    }
  })

  it('throws for a maxBufferSize lower than 0', () => {
    const preset = Object.assign({}, properBaseValvePreset, {
      maxBufferSize: -1,
    })
    try {
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Expected maxBufferSize to be a 'number' greater than -1 and lower than 4294967296; found: -1")
    }
  })

  it('throws for a maxBufferSize greater than 4294967295', () => {
    const preset = Object.assign({}, properBaseValvePreset, {
      maxBufferSize: 4294967296,
    })
    try {
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Expected maxBufferSize to be a 'number' greater than -1 and lower than 4294967296; found: 4294967296")
    }
  })

}

function timeValveAssertions(TargetClass) {

  const properTimeValvePreset = {
    name: null,
    maxBufferSize: 1000,
    bufferType: BUFFER_TYPE.QUEUE,
    overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
    resolveType: TIME_RESOLVE_TYPE.LAZY,
    cancelOnPump: false,
  }

  it('throws for an unknown cancelOnPump', () => {
    const preset = Object.assign({}, properTimeValvePreset, {
      cancelOnPump: 28,
    })
    try {
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Unexpected 'cancelOnPump': 28")
    }
  })

  it('throws for an unknown resolveType', () => {
    const preset = Object.assign({}, properTimeValvePreset, {
      resolveType: 'swing',
    })
    try {
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Unexpected 'resolveType': swing")
    }
  })

  it('throws for an unknown intervalMs', () => {
    const preset = Object.assign({}, properTimeValvePreset)
    try {
      new TargetClass(preset, 'one')
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Expected intervalMs to be a 'number' greater or equal to 0; found: one")
    }
  })

  it('throws for an intervalMs lower than 0', () => {
    const preset = Object.assign({}, properTimeValvePreset)
    try {
      new TargetClass(preset, -1)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Expected intervalMs to be a 'number' greater or equal to 0; found: -1")
    }
  })

}

function promiseValveAssertions(TargetClass) {

  const properPromiseValvePreset = {
    name: null,
    maxBufferSize: 1000,
    bufferType: BUFFER_TYPE.QUEUE,
    overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
    resolveType: PROMISE_RESOLVE_TYPE.MAP,
    cancelOnPump: false,
    timeoutMs: 0,
    poolSize: 1,
    cache: false,
    hashFunction: value => value,
    repeatPredicate: () => false,
  }

  it('throws for an unknown cancelOnPump', () => {
    const preset = Object.assign({}, properPromiseValvePreset, {
      cancelOnPump: 28,
    })
    try {
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Unexpected 'cancelOnPump': 28")
    }
  })

  it('throws for an unknown timeoutMs', () => {
    const preset = Object.assign({}, properPromiseValvePreset, {
      timeoutMs: 'one',
    })
    try {
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Expected timeoutMs to be a 'number' greater or equal to 0; found: one")
    }
  })

  it('throws for an timeoutMs lower than 0', () => {
    const preset = Object.assign({}, properPromiseValvePreset, {
      timeoutMs: -1,
    })
    try {
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Expected timeoutMs to be a 'number' greater or equal to 0; found: -1")
    }
  })

  it('throws for a poolSize lower than 1', () => {
    const preset = Object.assign({}, properPromiseValvePreset, {
      poolSize: 0,
    })
    try {
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Expected poolSize to be a 'number' greater or equal to 1; found: 0")
    }
  })

  it('throws for an unknown resolveType', () => {
    const preset = Object.assign({}, properPromiseValvePreset, {
      resolveType: 'pong',
    })
    try {
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Unexpected 'resolveType': pong")
    }
  })

  it('throws for an unknown cache', () => {
    const preset = Object.assign({}, properPromiseValvePreset, {
      cache: 'what?',
    })
    try {
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Unexpected 'cache': what?")
    }
  })

  it('throws for an unknown hashFunction', () => {
    const preset = Object.assign({}, properPromiseValvePreset, {
      hashFunction: 'hashuhash',
    })
    try {
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Unexpected 'hashFunction': hashuhash")
    }
  })

  it('throws for an unkonwn repeatPredicate', () => {
    const preset = Object.assign({}, properPromiseValvePreset, {
      repeatPredicate: 'zozo',
    })
    try {
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Unexpected 'repeatPredicate': zozo")
    }
  })

  it('throws for an unknown promiseFactory', () => {
    const preset = Object.assign({}, properPromiseValvePreset)
    try {
      new TargetClass(preset, 33)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Unexpected 'promiseFactory': 33")
    }
  })

}

function synchronousValveAssertions(TargetClass, functionType) {

  const properSynchronousValvePreset = {
    name: null,
    maxBufferSize: 1000,
    bufferType: BUFFER_TYPE.QUEUE,
    overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
  }

  it(`throws for an unknown ${ functionType }`, () => {
    try {
      new TargetClass(properSynchronousValvePreset, 2)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', `Expected ${ functionType } to be a function; found: number`)
    }
  })
}

describe('BaseValve constructor', () => {
  baseValveAssertions(BaseValve)
})

describe('TimeValve constructor', () => {
  baseValveAssertions(TimeValve)
  timeValveAssertions(TimeValve)
})

describe('PromiseValve constructor', () => {
  baseValveAssertions(PromiseValve)
  promiseValveAssertions(PromiseValve)
})

describe('FlattenValve constructor', () => {
  baseValveAssertions(FlattenValve)
})

describe('MapValve constructor', () => {
  baseValveAssertions(MapValve)
  synchronousValveAssertions(MapValve, 'transformFunc')
})

describe('FilterValve constructor', () => {
  baseValveAssertions(FilterValve)
  synchronousValveAssertions(FilterValve, 'predicateFunc')

  const properSynchronousValvePreset = {
    name: null,
    maxBufferSize: 1000,
    bufferType: BUFFER_TYPE.QUEUE,
    overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
  }

  it(`throws for an unknown ouput channel`, () => {
    try {
      const preset = Object.assign({}, properSynchronousValvePreset, {
        outputChannel: 'fake-channel',
      })
      new FilterValve(preset, () => true)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', `Unexpected 'outputChannel' name: fake-channel`)
    }
  })
})

describe('Splitter constructor', () => {

  const properSplitterPreset = {
    name: null,
    poolSize: 2,
  }

  it('throws for a preset other than object', () => {
    try {
      new Splitter('33', () => 1)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Expected 'preset' to be an 'object'")
    }
  })

  it('throws for a name other than a string or null', () => {
    try {
      const preset = Object.assign({}, properSplitterPreset, { name: 200 })
      new Splitter(preset, () => 1)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Expected the 'name' to be either a 'string' or 'null'; found: 200")
    }
  })

  it('throws for a poolSize other than a number', () => {
    try {
      const preset = Object.assign({}, properSplitterPreset, { poolSize: 'bob' })
      new Splitter(preset, () => 1)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Expected poolSize to be a 'number' greater or equal to 1; found: bob")
    }
  })

  it('throws for a poolSize lower than 1', () => {
    try {
      const preset = Object.assign({}, properSplitterPreset, { poolSize: 0 })
      new Splitter(preset, () => 1)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Expected poolSize to be a 'number' greater or equal to 1; found: 0")
    }
  })

  it('throws for an unknown classifyFn', () => {
    try {
      const preset = Object.assign({}, properSplitterPreset)
      new Splitter(preset, 'hahah')
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Unexpected 'classifyFn': hahah")
    }
  })

})
