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
} = require('../index.js')

function baseValveAssertions(TargetClass) {

  const properBaseValvePreset = {
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
      expect(err).to.have.property('message', "Expected maxBufferSize to be a 'number' greater than -1; found: one")
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
      expect(err).to.have.property('message', "Expected maxBufferSize to be a 'number' greater than -1; found: -1")
    }
  })

}

function timeValveAssertions(TargetClass) {

  const properTimeValvePreset = {
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
    maxBufferSize: 1000,
    bufferType: BUFFER_TYPE.QUEUE,
    overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
    resolveType: PROMISE_RESOLVE_TYPE.MAP,
    cancelOnPump: false,
    timeoutMs: 0,
    poolSize: 1,
    cache: false,
    hashFunction: value => value,
    repeatPredicate: async () => false,
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

function transformValveAssertions(TargetClass) {

  const properTransformValvePreset = {
    maxBufferSize: 1000,
    bufferType: BUFFER_TYPE.QUEUE,
    overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
  }

  it('throws for an unknown transformFunc', () => {
    try {
      new TargetClass(properTransformValvePreset, 2)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Expected transformFunc to be a function; found: number")
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
  transformValveAssertions(MapValve)
})

describe('FilterValve constructor', () => {
  baseValveAssertions(FilterValve)
  transformValveAssertions(FilterValve)
})
