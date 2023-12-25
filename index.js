'use strict'

const { MoonPipe } = require('./lib/MoonPipe.js')
const {
  BaseValve,
  BUFFER_TYPE,
  CHANNEL_TYPE,
  OVERFLOW_ACTION,
  BufferOverflowError,
  BasePresets,
} = require('./lib/BaseValve.js')
const {
  PromiseValve,
  PROMISE_RESOLVE_TYPE,
  PromisePresets,
  TimeoutError,
} = require('./lib/PromiseValve.js')
const {
  TimeValve,
  TIME_RESOLVE_TYPE,
  TimePresets,
} = require('./lib/TimeValve.js')

const {
  FlattenValve,
  MapValve,
  FilterValve,
  SynchronousPresets,
} = require('./lib/SynchronousValves.js')

const { Splitter } = require('./lib/Splitter.js')

const { delayPromise } = require('./lib/utils.js')

module.exports = {
  MoonPipe,
  BaseValve,
  BUFFER_TYPE,
  CHANNEL_TYPE,
  OVERFLOW_ACTION,
  BufferOverflowError,
  BasePresets,
  PromiseValve,
  PROMISE_RESOLVE_TYPE,
  PromisePresets,
  TimeoutError,
  TimeValve,
  TIME_RESOLVE_TYPE,
  TimePresets,
  FlattenValve,
  MapValve,
  FilterValve,
  SynchronousPresets,
  Splitter,
  delayPromise,
}
