# Changelog

### 2.7.0
Add a `Cache` class and move the `cleanupActions` to it
Add a `cachePopulate` method

### 2.6.0
Add a `getOnIdlePromise` method

### 2.5.1
- Add JSDoc comments
- Generate TypeScript declaration files

### 2.5.0
- Add a `rePumpLast` method
- From **Tap** valves always emit pumped `values`, regardless of what is in the **cache**
- In **Tap** valves, when the **cache** is enabled, cache `results` returned from promises (previously the pumped `values` were cached)
- Add some asynchronicity to results emitted from the **cache**
- Clear the **cache** lazily in order to avoid race conditions
- Bugfix: After the pipe recovers from an error, **pool** valves should resume at their full capacities

### 2.4.0
- Add a `cacheClearByResult` and `cacheUpdateByResult` methods
- Catch errors thrown by the `hashFunction`

### 2.3.0
- Move the `outputChannel` param from `presets` to the `.pipe` method

### 2.2.0
- Add the `onBusy` hook. Deprecate the `onBusyTap` hook
- Add the `repeatBackoffFactory`, `ConstantBackoff`, and `LinearBackoff`
- Do not accumulate values pumped synchronously in `PromiseValves`
- Call the `onCancel` callback whenever a promise times out
- Clear the promise timeout whenever a promise is canceled
- Create a `PromiseContext` for each inner promise separately
- Clean up the documentation
- Fix the repository url in the package.json

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
