# Changelog

### 2.1.1
- Silently ignore errors in the onCancel callbacks

### 2.1.0
- Update dev dependencies
- Add a `filterError` valve
- Add an `outputChannel` preset param
- Export `CHANNEL_TYPE`
- Export `SynchronousPresets`

### 2.0.0
#### major breaking changes:
- `MoonPipe->buffersClearOne(valveName)` takes a `valveName` instead of the `valveIndex` now
- `MoonPipe->cacheClearOne(valveName, ...values)` takes a `valveName` instead of the `valveIndex` now
- expect the `repeatePredicate` to be a **synchronous** function and do not await it anymore

#### less important breaking changes:
- Add a `name` param to the `BaseValve` presets
- Add a `preset` param to the `Splitter` constructor
- `Splitter>buffersClearOne(valveName)` takes a `valveName` instead of the `valveIndex` now
- `Splitter->cacheClearOne(valveName, ...values)` takes a `valveName` instead of the `valveIndex` now
- Remove `MoonPipe->getValveAtTotalIndex(valveIndex)`
- Remove `MoonPipe->validateValveTotalIdnex(valveIndex)`
- remove `BaseValve->isEmpty()`
- Change the constructor signatures of the `RichPromise` and `Splitter`

#### non-breaking changes:
- `MoonPipe->splitBy(poolSize, classifyFn, options)` can take `options` as the 3rd parameter
- `BaseValve->cacheClearAt(...values)` can take more than a single value now
- `PromiseValve>cacheClearAt(...values)` can take more than a single value now

### 1.3.0
- add a `splitBy`/`join` combo
- add a `delayPromise` utility function

### 1.2.0
- add an `onBusyTap` hook
- add an `onIdle` hook
- bugfix for `numberOfReservedSlots--` for `cancelEager`
- bugfix for `numberOfReservedSlots=0` for `TimeValve.bufferClear`

### 1.1.1
- cancelEager will push only the first value through

  The cancelEager valve was useless; it passed all the values through immediately. From now on it will only pass on the value immediately only if there's no active timeout. Subsequent values will have to wait for the timeout to complete.

- skipEager will reserve a slot in the buffer until the timeout completes

  The skipEager valve would have an empty slot right after the value was emitted. Because of that the second value would not be skipped. Now all subsequent values are skipped until the timeout completes.

- when maxBufferSize is 0:
  - sliceValves will not push to the lastSlice
  - otherValves will not push to the buffer

### 1.1.0
- Add an 'onCancel' callback

### 1.0.1
- Add a "Contributing" section to the README file
- Replace the term "operator" with "vavle"
- Add the "test" and "playground" folders to .npmignore
