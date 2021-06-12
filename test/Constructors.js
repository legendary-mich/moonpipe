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
      expect(err).to.have.property('message', "Expected maxBufferSize to be a 'number' greater than 0; found: one")
    }
  })

  it('throws for a maxBufferSize lower than 1', () => {
    const preset = Object.assign({}, properBaseValvePreset, {
      maxBufferSize: 0,
    })
    try {
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Expected maxBufferSize to be a 'number' greater than 0; found: 0")
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

  const properTimeValvePreset = {
    maxBufferSize: 1000,
    bufferType: BUFFER_TYPE.QUEUE,
    overflowAction: OVERFLOW_ACTION.EMIT_ERROR,
    resolveType: PROMISE_RESOLVE_TYPE.MAP,
    cancelOnPump: false,
    timeoutMs: 0,
    cache: false,
    hashFunction: value => value,
    repeatOnError: 0,
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

  it('throws for an unknown timeoutMs', () => {
    const preset = Object.assign({}, properTimeValvePreset, {
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
    const preset = Object.assign({}, properTimeValvePreset, {
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

  it('throws for an unknown resolveType', () => {
    const preset = Object.assign({}, properTimeValvePreset, {
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
    const preset = Object.assign({}, properTimeValvePreset, {
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
    const preset = Object.assign({}, properTimeValvePreset, {
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

  it('throws for an unknown repeatOnError', () => {
    const preset = Object.assign({}, properTimeValvePreset, {
      repeatOnError: 'one',
    })
    try {
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Expected repeatOnError to be a 'number' greater or equal to 0; found: one")
    }
  })

  it('throws for an repeatOnError lower than 0', () => {
    const preset = Object.assign({}, properTimeValvePreset, {
      repeatOnError: -1,
    })
    try {
      new TargetClass(preset)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Expected repeatOnError to be a 'number' greater or equal to 0; found: -1")
    }
  })

  it('throws for an unknown promiseFactory', () => {
    const preset = Object.assign({}, properTimeValvePreset)
    try {
      new TargetClass(preset, 33)
      throw new Error('should have thrown')
    }
    catch (err) {
      expect(err).to.have.property('message', "Unexpected 'promiseFactory': 33")
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
