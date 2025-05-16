# moonpipe
Throttle streams of data while passing them through promises and timers. Use various valves to discard redundant data points.

- [TL;DR](#tldr)
- [Predefined valves](#predefined-valves)
  - [Overriding predefined valves](#overriding-predefined-valves)
- [TimeValves](#timevalves)
  - [Predefined TimeValves](#predefined-timevalves)
  - [Custom TimeValves](#custom-timevalves)
- [PromiseValves](#promisevalves)
  - [Predefined PromiseValves](#predefined-promisevalves)
  - [Cache](#cache-in-promisevalves)
    - [Cache invalidation](#cache-invalidation)
    - [Cache populate](#cache-populate)
    - [Custom hashFunction](#custom-hashfunction)
  - [Timeout](#timeout-in-promisevalves)
  - [Repeating on Error](#repeating-on-error-in-promisevalves)
  - [onCancel callback](#oncancel-callback-in-promisevalves)
  - [Pooling](#pooling-in-promisevalves)
  - [Custom PromiseValves](#custom-promisevalves)
- [SynchronousValves](#synchronousvalves)
  - [filter](#filter)
  - [map](#map)
  - [flatten](#flatten)
- [Cycles in data streams](#cycles-in-data-streams)
- [Error handling](#error-handling)
- [Hooks](#hooks)
  - [onBusyTap (DEPRECATED)](#onbusytap-deprecated)
  - [onBusy](#onbusy)
  - [onIdle](#onidle)
  - [onBusyBy](#onbusyby)
  - [onIdleBy](#onidleby)
- [History](#history)
- [As Promise](#as-promise)
- [Clearing out buffers](#clearing-out-buffers)
- [SplitBy/Join](#splitbyjoin)
- [Presets explained](#presets-explained)
  - [Base Preset Params](#base-preset-params-these-params-are-common-to-both-the-timevalves-and-promisevalves)
  - [TimeValve Preset Params](#timevalve-preset-params)
  - [PromiseValve Preset Params](#promisevalve-preset-params)
- [Utilities](#utilities)
- [TypeScript](#typescript)
  - [Type system limitations](#type-system-limitations)
- [Versioning](#versioning)
- [Contributing](#contributing)

## TL;DR

```bash
npm install moonpipe
```
```javascript
// A typical setup for converting user input into http GET requests.
// For PUT requests use throttleMap in place of the cancelMap.
const { MoonPipe } = require('moonpipe')
const mp = new MoonPipe()
  .onBusy(() => console.log('// loading'))
  .cancelLazy(1000) // in other libs known as debounce
  .cancelMap(async (val) => 'initial_' + val) // a GET request goes here
  .queueTap(async (val) => console.log('// output:', val))
  .queueError(async (err) => console.log('// error:', err))
  .onIdle(() => console.log('// done'))

mp.pump('a')
mp.pump('b')
mp.pump('c')
mp.pump('d')

// loading
// output: initial_d
// done
```

## Predefined valves

The easiest way to start with moonpipe is to understand the naming convention behind predefined valves. Most of the predefined valves are descendants of either a **TimveValve**, or a **PromiseValve**. You will tell them apart by the suffix in the name. Predefined **PromiseValves** end with the **Tap**, **Map**, and **Error** suffixes, whereas predefined **TimeValves** end with the **Eager** and **Lazy** suffixes.

```
queueTap    queueMap    queueEager    queueLazy    queueError
cancelTap   cancelMap   cancelEager   cancelLazy   cancelError
throttleTap throttleMap throttleEager throttleLazy throttleError
skipTap     skipMap     skipEager     skipLazy     skipError
sliceTap    sliceMap    sliceEager    sliceLazy
poolTap     poolMap
splitBy     join
flatten     map         filter        filterError
```

Prefixes, on the other hand, are common to both types of valves. They define how pumped values are treated internally.

Prefixes:
- **queue** - queues every pumped value, and processes one after another
- **cancel** - cancels the running promise/timeout and replaces the current value with the new one
- **throttle** - replaces the value next in line with the new one, and does not cancel the promise/timeout
- **skip** - skips every new value until the promise/timeout finishes
- **slice** - packs values into arrays of the defined slice size, and processes one slice after another
- **pool** - runs promises concurrently with the predefined pool size

Suffixes:
- **Map** - pumps the result of a promise to the next valve
- **Tap** - waits for a promise to complete and pumps the input value
- **Error** - it's like the Map suffix, but it is used only when the pipe operates in the Error mode. It is used to catch errors.
- **Eager** - pumps the input value, and waits until the time passes before taking on the next value
- **Lazy** - waits until the time passes and pumps the first value in line

In general, predefined **TimeValves** take a number of **milliseconds** as the first argument, and predefined **PromiseValves** take a **promiseFactory** as the first argument.
```javascript
.queueEager(delayMs)
.queueTap(promiseFactory)
```
Exceptions to the above rule are **slice**, and **pool** valves, which take a **sliceSize** and a **poolSize** as the first arguments.
```javascript
.sliceEager(sliceSize, delayMs)
.sliceTap(sliceSize, promiseFactory)
.poolTap(poolSize, promiseFactory)
```
For more comprehensive info about time/promise valves, as well as info about other types of valves, see respective sections further down in this documentation.

### Overriding predefined valves

Every of the predefined valves can be overridden with a set of options. **PromiseValves** accept options specific to the `PromiseValve` class. **TimeValves** accept options specific to the `TimeValve` class. The `options` parameter is always passed in as **the last argument**. For example `throttleMap(promiseFactory, options)`. I'm going to show you a simple example here. For the full list of options see the [Presets explained](#presets-explained) section.

```javascript
const { MoonPipe } = require('moonpipe')
const mp = new MoonPipe()
  .throttleMap(async (val) => 'initial_' + val, {
    maxBufferSize: 2, // <------- overridden HERE
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })
```

## TimeValves
TimeValves slow down incoming data and may also discard redundant data points.

### Predefined TimeValves

Predefined TimeValves can be divided into **Eager** valves and **Lazy** valves. The only difference between the two is that the **Eager** valves let the first data point pass through immediately, whereas **Lazy** valves hold the first data point until the specified time passes.

Another classification that one can make is to split the valves by the name prefix:
- **queue** valves process every data point one by one and do NOT discard any of them.
- **skip** valves process only the **first** data point and, until the specified time passes, discard everything that comes next.
- **throttle** valves process only the **last** data point and, until the specified time passes, discard everything that comes before.
- **cancel** valves are like **throttle** valves but they additionally **reset the timer** whenever a new data point arrives.
- **slice** valves pack the incoming data into arrays of the defined size.

What follows is a list of all the predefined TimeValves. Most of them take a number of **milliseconds** as the first argument, and an **optional options** object as the second one. Slice valves are an exception to this rule.
```javascript
.queueEager(delayMs, options)             .queueLazy(delayMs, options)
.cancelEager(delayMs, options)            .cancelLazy(delayMs, options)
.throttleEager(delayMs, options)          .throttleLazy(delayMs, options)
.skipEager(delayMs, options)              .skipLazy(delayMs, options)

.sliceEager(sliceSize, delayMs, options)  .sliceLazy(sliceSize, delayMs, options)
```

TimeValves are added to the pipe like this:
```javascript
const mp = new MoonPipe()
  .queueEager(1000)
  .queueTap(async (val) => console.log('// output:', val))
```

The best way to find out about differences between predefined `TimeValves` is to run and study the example in `playground/predefined-time-valves.js` that can be found on github. In short, for this input:
```javascript
mp.pump('A')
mp.pump('B')
await delayPromise(500)
mp.pump('C')
```
the pipe will generate the following outputs, where the `time` label is the number of milliseconds passed since the start of the program to the moment when the pumped value got to the other side of the valve:
```javascript
// .queueEager(1000)
// out: A, time: 8
// out: B, time: 1008
// out: C, time: 2010

// .queueLazy(1000)
// out: A, time: 1001
// out: B, time: 2003
// out: C, time: 3003

// .skipEager(1000)
// out: A, time: 0

// .skipLazy(1000)
// out: A, time: 1001

// .throttleEager(1000)
// out: A, time: 0
// out: C, time: 1001

// .throttleLazy(1000)
// out: C, time: 1002

// .cancelEager(1000)
// out: A, time: 0
// out: C, time: 1502

// .cancelLazy(1000)
// out: C, time: 1502

// .sliceEager(3, 1000)
// out: [ 'A' ], time: 7
// out: [ 'B', 'C' ], time: 1008

// .sliceLazy(3, 1000)
// out: [ 'A', 'B', 'C' ], time: 1002
```

### Custom TimeValves

Predefined TimeValves internally run an instance of the `TimeValve` class. It is possible to create your own TimeValve flavors and connect them to a pipe with the `.pipe` method. The `.pipe` method accepts a `valve` as the first argument, and optionally two `CHANNEL_TYPE` params as the second and third arguments. By default channels are set to the `CHANNEL_TYPE.DATA`, so you don't have to worry about them. If you, however, want to use your valve as an error handler, set the `inputChannel` to the `CHANNEL_TYPE.ERROR` and the `outputChannel` to either `CHANNEL_TYPE.ERROR` or `CHANNEL_TYPE.DATA`.
```javascript
//             inputChannel        outputChannel
mp.pipe(valve, CHANNEL_TYPE.ERROR, CHANNEL_TYPE.DATA)
```

Here I will show you an example of a TimeValve which is similar to the `throttleLazy` valve, but has a bigger `maxBufferSize`. For the complete info about presets look at the [Presets explained](#presets-explained) section.

```javascript
const {
  MoonPipe,
  TimeValve,
  TIME_RESOLVE_TYPE,
  BUFFER_TYPE,
  OVERFLOW_ACTION,
} = require('moonpipe')

const preset = {
  name: null,
  maxBufferSize: 3,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.SHIFT,
  resolveType: TIME_RESOLVE_TYPE.LAZY,
  cancelOnPump: false,
}

const customTimeValve = new TimeValve(preset, 1000)

const mp = new MoonPipe()
  .pipe(customTimeValve) // <-- your custom valve is plugged in HERE
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump('a')
mp.pump('b')
mp.pump('c')
mp.pump('d')
mp.pump('e')

// output: c
// output: d
// output: e
```

## PromiseValves
PromiseValves pass incoming data through promises and may also discard redundant data points.

### Predefined PromiseValves

Predefined PromiseValves can be divided into **Tap** valves and **Map** valves. The only difference between the two is that the **Tap** valves return the data point that has been passed to the `Promise`, whereas the **Map** valves return the value returned by the `Promise`.

Another classification that one can make is to split the valves by the name prefix:
- **queue** valves process every data point one by one and do NOT discard any of them.
- **skip** valves process only the **first** data point and, until the `Promise` settles, discard everything that comes next.
- **throttle** valves process the **first** and the **last** data points and, until the `Promise` settles, discard everything that comes between.
- **cancel** valves are like **queue** valves but they additionally **cancel the running Promise** whenever a new data point arrives.
- **slice** valves pack the incoming data into arrays of the defined size.

What follows is a list of all the predefined PromiseValves. Most of them take a `promiseFactory` as the first argument, and an **optional options** object as the second one. Slice valves and pool valves are an exception to this rule.
```javascript
.queueTap(promiseFactory, options)             .queueMap(promiseFactory, options)
.cancelTap(promiseFactory, options)            .cancelMap(promiseFactory, options)
.throttleTap(promiseFactory, options)          .throttleMap(promiseFactory, options)
.skipTap(promiseFactory, options)              .skipMap(promiseFactory, options)

.sliceTap(sliceSize, promiseFactory, options)  .sliceMap(sliceSize, promiseFactory, options)
.poolTap(poolSize, promiseFactory, options)    .poolMap(poolSize, promiseFactory, options)
```

The `promiseFactory` is a function that takes an arbitrary value and returns a `Promise`. Any of the following will do for the factory function:
```javascript
const factory1 = async (val) => val.toUpperCase()
const factory2 = (val) => Promise.resolve(val.toUpperCase())
```
PromiseValves are added to the pipe like this:
```javascript
const mp = new MoonPipe()
  .queueMap(async (val) => val.toUpperCase())
  .queueTap(async (val) => console.log('// output:', val))
```

The best way to find out about differences between predefined `PromiseValves` is to run and study the example in `playground/predefined-promise-valves.js` that can be found on github. In short, for this input:
```javascript
mp.pump('a')
mp.pump('b')
mp.pump('c')
```
the pipe will generate the following outputs, where the `side` label is the value being processed by the `Promise`, and the `out` label is the value returned by the valve after the `Promise` has settled.
```javascript
// .queueTap(() => val.toUpperCase())
// side: a, time: 6
// out : a, time: 14
// side: b, time: 14
// out : b, time: 20
// side: c, time: 20
// out : c, time: 26

// .queueMap(() => val.toUpperCase())
// side: a, time: 0
// out : A, time: 6
// side: b, time: 6
// out : B, time: 12
// side: c, time: 12
// out : C, time: 19

// .skipTap(() => val.toUpperCase())
// side: a, time: 0
// out : a, time: 7

// .skipMap(() => val.toUpperCase())
// side: a, time: 0
// out : A, time: 6

// .throttleTap(() => val.toUpperCase())
// side: a, time: 1
// out : a, time: 7
// side: c, time: 7
// out : c, time: 13

// .throttleMap(() => val.toUpperCase())
// side: a, time: 0
// out : A, time: 6
// side: c, time: 6
// out : C, time: 12

// .cancelTap(() => val.toUpperCase())
// side: a, time: 0
// side: b, time: 0
// side: c, time: 0
// out : c, time: 6

// .cancelMap(() => val.toUpperCase())
// side: a, time: 1
// side: b, time: 1
// side: c, time: 1
// out : C, time: 7

// .sliceTap(3, () => val.toUpperCase())
// side: [ 'a' ], time: 6
// side: [ 'b', 'c' ], time: 14

// .sliceMap(3, () => val.toUpperCase())
// side: [ 'a' ], time: 1
// side: [ 'b', 'c' ], time: 7
```


### Cache in PromiseValves
The `result` of a Promise can be cached with the `cache: true` param provided to the options. Results are cached in a hash map, where by default the pumped `value` is used as the `key`. The way the keys are derived can be customized with a custom hash function (see down below).
```javascript
const { MoonPipe } = require('moonpipe')
const mp = new MoonPipe()
  .queueMap(async (val) => {
    console.log('...side effect')
    return 'mapped_' + val
  }, {
    cache: true, // <------ cache is enabled HERE
    name: 'bigJohn', // <-- a name that you will refer to when wiping out the cache in this particular valve
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump('a')
mp.pump('b')
mp.pump('a')

// ...side effect
// output: mapped_a
// ...side effect
// output: mapped_b
// output: mapped_a <-- no side effect, because the value comes directly from the cache
```
In **Tap** valves, when the cache is enabled, `results` returned from Promises are cached (not the pumped `values`). However, Tap valves always emit pumped `values` regardless of what is in the cache. The corollary is that the `cacheUpdateByResult` method makes no difference for **Tap** valves, both the `cacheUpdateByResult` and `cacheClearByResult` methods are always fed with the `results` returned from Promises.

#### Cache invalidation
The cache can be invalidated with one of the following.
```javascript
mp.cacheClearAll() // clears the entire cache in all valves.
mp.cacheClearOne('bigJohn') // clears the entire cache in the valve named bigJohn.
mp.cacheClearOne('littleJohn', 'a') // clears only the entry at the key derived from the value 'a' in the valve named littleJohn.
mp.cacheClearOne('oldJohn', 'a', 'b') // clears entries at keys derived from values 'a' and 'b' in the valve named oldJohn.
mp.cacheClearByResult('JohnWayne', (result, key) => boolean) // clears results for which the predicate function returns true.
mp.cacheUpdateByResult('DirtyHarry', (oldResult, key) => newResult) // swaps old results for new results in the DirtyHarry valve.
```
Note the difference between the `value`, the `key`, and the `result`. The `value` is what goes into the Promise. The `result` is what comes out of the Promise. The `key` is a label for the `result` in the hash map; it is derived from the `value`.

In order to avoid race conditions the cache is invalidated in predictable moments. One such a moment is just before a Promise is created. There's nothing going on in that moment; the previous Promise has settled already, and a new one hasn't started yet, which makes it a perfect choice for cache invalidation. This means that the cache is invalidated **lazily**. When you call one of the `cacheClear` methods, you will see the effect only after the currently running Promise has settled, and just before a new Promise is created.

In case of promise pools, the cache is invalidated only after all Promises in the pool have settled. This means that after calling one of the `cacheClear` methods, new Promises will not be created until all the currently running ones settle. Once all of them have settled, the cache is invalidated, and the pool is filled with a new set of Promises.

*If you are curious how running a method by a valve name acts on the `splitBy` valve, look at the [Clearing out buffers](#clearing-out-buffers) section.*

#### Cache populate
The cache can be populated by hand. The `cachePopulate(valveName, value, result)` method takes 3 arguments: the name of the valve, a `value` for which the `result` will be cached, and the `result`. The `result` will be cached at a `key` derived from the `value` passed through the `hashFunction` the same way it is done in the regular flow.
```javascript
const mp = new MoonPipe()
  .queueMap(async (val) => 'mapped_' + val, {
    cache: true,
    name: 'bigJohn',
  })
  .queueTap(async (val) => {
    console.log('// output:', val)
  })

mp.cachePopulate('bigJohn', 'a', 'zzz')
mp.pump('a')
mp.pump('b')

// output: zzz
// output: mapped_b
```

#### Custom hashFunction
A Custom hash function can be used to generate custom `keys` at which promise `results` will be stored in the cache. Hash functions are useful when pumping arrays or objects, in which case the array/object reference would be used by default for the key. Hash functions can also be useful when doing a case-insensitive search.
```javascript
const { MoonPipe } = require('moonpipe')
const mp = new MoonPipe()
  .queueMap(async (val) => {
    console.log('...side effect')
    return 'mapped_' + val
  }, {
    cache: true,
    hashFunction: (val) => val.toLowerCase(), // results will be stored at val.toLowerCase()
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump('A')
mp.pump('a')

// ...side effect
// output: mapped_A
// output: mapped_A <-- a result from the cache at the key 'a'
```

### Timeout in PromiseValves
Use the `timeoutMs` param for PromiseValves that are not supposed to live too long. If the promise is not settled within the provided number of milliseconds, it will be rejected with a `TimeoutError` and the [onCancel callback](#oncancel-callback-in-promisevalves) will be called. `timeoutMs: 0` means disabled.
```javascript
const { MoonPipe } = require('moonpipe')
const { delayPromise } = require('../test/utils.js')

const mp = new MoonPipe()
  .queueTap(async () => {
    await delayPromise(3)
  }, {
    timeoutMs: 1, // <---------- timeout is enabled HERE
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })
  .queueError(async (err) => {
    console.log('error:', err.message)
  })

mp.pump('a')

// error: TimeoutError
```

### Repeating on error in PromiseValves
A rejected promise can be retried before the error is reported to the pipe. Every error returned from a rejected promise is passed to the `repeatPredicate` function, that takes an `attemptsMade` counter as the first argument, an `error` as the second one, and returns a `boolean` value which signifies whether the promise should be retried or not. By default promises are retried immediately. If you want to add a delay between retries, use a `repeatBackoffFactory` function.

If the `repeatPredicate` throws an error, the promise is automatically rejected and will not be retried anymore.

Since moonpipe **v2.0.0** the `repeatPredicate` is expected to be **synchronous** and will not be awaited.

```javascript
const { MoonPipe, ConstantBackoff, LinearBackoff } = require('moonpipe')
const mp = new MoonPipe()
  .queueTap(async (val) => {
    console.log('// side:', val)
    throw 'err_' + val
  }, {
    repeatPredicate: (attemptsMade, err) => {
      return attemptsMade <= 3 && err === 'err_b'
    },
    // repeatBackoffFactory: () => new ConstantBackoff(1000), // OPTIONAL
    // repeatBackoffFactory: () => new LinearBackoff(1000), // OPTIONAL
    // repeatBackoffFactory: () => new ConstantBackoff(0), // OPTIONAL DEFAULT
  })
  .queueError(async (err) => {
    console.log('// error:', err)
  })

mp.pump('a')
mp.pump('b')
mp.pump('c')

// side: a
// error: err_a
// side: b
// side: b
// side: b
// side: b
// error: err_b
// side: c
// error: err_c
```

### onCancel callback in PromiseValves
Sometimes you may want to do some cleanup when a promise is being **canceled**, or when it [times out](#timeout-in-promisevalves). To facilitate custom logic on promise cancellation a `promiseContext` is provided to the promise factory function as the second argument. An `onCancel` callback can be attached to the `promiseContext`; it will be called when the promise is being **canceled**, or when it [times out](#timeout-in-promisevalves). If the **callback throws** an error, the error will be pumped to the next **error valve** in line. What follows is an example of how to clear a timeout from within one of the `cancel` PromiseValves. *(Note that the sole purpose of this example is to show how to use the `onCancel` callback. Normally, for anything related to timeouts, you are better off using TimeValves like e.g. cancelLazy)*

```javascript
const { MoonPipe } = require('moonpipe')

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

// clearing: a
// clearing: b
// clearing: c
// greetings from the timeout: d
// output: d
```

### Pooling in PromiseValves
Promises can be run concurrently in two ways; either with the `poolMap`, `poolTap` predefined valves, or with the `poolSize` param set in any of the PromiseValves.

Here comes an example of the predefined valves. They take the **size of the pool** as the first argument and a `promiseFactory` as the second one.
```javascript
const { MoonPipe } = require('moonpipe')
const mp = new MoonPipe()
  .poolMap(2, async (val) => {
    return 'mapped_' + val
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })
```

Here is the same thing but using the `poolSize` param provided through the `options` object.

```javascript
const { MoonPipe } = require('moonpipe')

const mp = new MoonPipe()
  .queueMap(async (val) => {
    return 'mapped_' + val
  }, {
    poolSize: 2, // <----- poolSize is increased HERE
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })
```

### Custom PromiseValves

Predefined PromiseValves internally run an instance of the `PromiseValve` class. It is possible to create your own PromiseValve flavors and connect them to a pipe with the `.pipe` method. The `.pipe` method accepts a `valve` as the first argument, and optionally two `CHANNEL_TYPE` params as the second and third arguments. By default channels are set to the `CHANNEL_TYPE.DATA`, so you don't have to worry about them. If you, however, want to use your valve as an error handler, set the `inputChannel` to the `CHANNEL_TYPE.ERROR` and the `outputChannel` to either `CHANNEL_TYPE.ERROR` or `CHANNEL_TYPE.DATA`.
```javascript
//             inputChannel        outputChannel
mp.pipe(valve, CHANNEL_TYPE.ERROR, CHANNEL_TYPE.DATA)
```

Here I will show you an example of a PromiseValve which is similar to the `throttleMap` valve, but has a bigger `maxBufferSize`. For the complete info about presets look at the [Presets explained](#presets-explained) section.

```javascript
const {
  MoonPipe,
  PromiseValve,
  PROMISE_RESOLVE_TYPE,
  BUFFER_TYPE,
  OVERFLOW_ACTION,
  ConstantBackoff,
} = require('moonpipe')

const preset = {
  name: null,
  maxBufferSize: 3,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.SHIFT,
  resolveType: PROMISE_RESOLVE_TYPE.MAP,
  cancelOnPump: false,
  timeoutMs: 0,
  poolSize: 1,
  cache: false,
  hashFunction: value => value,
  repeatPredicate: () => false,
  repeatBackoffFactory: () => new ConstantBackoff(0),
}

const customTimeValve = new PromiseValve(preset, val => val.toUpperCase())

const mp = new MoonPipe()
  .pipe(customTimeValve) // <-- your custom valve is plugged in HERE
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump('a')
mp.pump('b')
mp.pump('c')
mp.pump('d')
mp.pump('e')

// output: A
// output: D
// output: E
```

## SynchronousValves

Synchronous valves use neither timers nor promises. They are meant to run simple functions over the incoming data.

### filter

The `filter(predicate, options)` valve takes a **predicate** function as the first argument. Whenever the predicate function returns `true` for a value, the value is let through the filter.
```javascript
const mp = new MoonPipe()
  .filter(val => val % 2 === 0)
  .queueTap(val => console.log('// out: ', val))

mp.pump(1)
mp.pump(2)
mp.pump(3)
mp.pump(4)

// out:  2
// out:  4
```

### map

The `map(transform, options)` valve takes a **transform function** as the first argument. Whatever is returned from the map function, is pumped to the next valve in line.
```javascript
const mp = new MoonPipe()
  .map(val => val % 2 === 0)
  .queueTap(val => console.log('// out: ', val))

mp.pump(1)
mp.pump(2)
mp.pump(3)
mp.pump(4)

// out:  false
// out:  true
// out:  false
// out:  true
```

### flatten

The `flatten(options)` valve is meant to process **arrays**. It emits every element of an incoming array, as a standalone entity.
```javascript
const mp = new MoonPipe()
  .flatten()
  .queueTap(val => console.log('// out: ', val))

mp.pump([1, 2])

// out:  1
// out:  2
```

## Cycles in data streams

If there is a **cycle** in the data stream, and the data between the beginning and the end of the **cycle** is irrelevant, it can be pruned off with the `squashDownTo` function.

`squashDownTo` is an optional function which, if set, trims the internal buffer from the first value returned by the function to the end of the buffer. If the buffer looks like `[1, 2, 3, 4, 5]`, the function is an identity function `val => val`, and the value being pumped is `3`, values from 3 to the end of the buffer will be removed, and the pumped value will be added at the end. The buffer will look like `[1, 2, 3]`.

For example, it can be useful when there is a `post`, `put`, `delete` cycle in the stream.
```javascript
const { MoonPipe } = require('moonpipe')
const mp = new MoonPipe()
  .queueMap(async (val) => {
    return `mapped ${val.op} ${val.i}`
  }, {
    squashDownTo: (val) => val.op, // <------- HERE
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump({op: 'post', i: 0}) // processed right away
mp.pump({op: 'put ', i: 1}) // removed by i:2
mp.pump({op: 'put ', i: 2}) // removed by i:5
mp.pump({op: 'del ', i: 3}) // removed by i:5
mp.pump({op: 'post', i: 4}) // removed by i:5
mp.pump({op: 'put ', i: 5}) // removed by i:6
mp.pump({op: 'put ', i: 6})
mp.pump({op: 'del ', i: 7})

// output: mapped post 0
// output: mapped put  6
// output: mapped del  7
```

 Errors thrown in a `squashDownTo` function are passed to the next error valve in line.

## Error handling
When an error is thrown by one of the normal valves, the pipe switches its active channel to the `CHANNEL_TYPE.ERROR`. Now it operates in an `error mode` which means that no new promises will be created until the active channel switches back to the `CHANNEL_TYPE.DATA`. Existing promises will be able to finish though, which can result in either a valid response or a new error. Valid responses will be put off for later, and errors will be pumped to the `ErrorValves`. The active channel will be switched back to the `CHANNEL_TYPE.DATA` when there are no more errors to handle.

There are 4+1 predefined valves that can be used to handle errors. 4 of them behave like their brothers from the `Map` family with that difference that they operate only in the `error mode`. The most common one is the `queueError` valve, which handles errors one after another. Another one that may be useful is the `skipError` valve. It handles the first error, and let all the subsequent ones slide. Other valves that can be used for error handling are `cancelError` and `throttleError`.

If you don't add any error handlers to the pipe, errors will be **silently ignored**.
```javascript
const { MoonPipe } = require('moonpipe')
const mp = new MoonPipe()
  .queueTap(async (val) => {
    console.log('out 1:', val)
    throw 'thrown in queueTap'
  })
  .queueError(async (err) => {
    console.log('error:', err)
    return 'b'
  })
  .queueTap(val => {
    console.log('out 2:', val)
  })

mp.pump('a')

// out 1: a
// error: thrown in queueTap
// out 2: b
```

There is also 1 synchronous error handler, namely `filterError`. It operates in the `error mode`, like other error handlers, and swallows errors that do not meet the criteria of the filter predicate.
```javascript
  // Errors other than the `new Error('haha')` will be passed down the pipe.
  .filterError(err => err.message !== 'haha')
```

## Hooks

### onBusyTap (DEPRECATED)
The `onBusyTap` hook is called every time the pipe goes from an `idle` state to a `busy` state. The callback provided by you is supposed to be `synchronous`. It takes the pumped value as the first argument. **If it throws** an error, the error will be pumped to the **nearest error valve**. There can be **only one** onBusyTap hook.
```javascript
const mp = new MoonPipe()
  .onBusyTap((value) => {
    console.log('is loading', value)
  })
```

### onBusy
The `onBusy` hook is called every time the pipe goes from an `idle` state to a `busy` state. The callback provided by you is supposed to be `synchronous`. It does NOT take any arguments. **If it throws** an error, the error will be **silently ignored**. There can be **only one** onBusy hook.
```javascript
const mp = new MoonPipe()
  .onBusy(() => {
    console.log('is loading')
  })
```

### onIdle
The `onIdle` hook is called every time the pipe goes from a `busy` state to an `idle` state. The callback provided by you is supposed to be `synchronous`. It does NOT take any arguments. **If it throws** an error, the error will be **silently ignored**. There can be **only one** onIdle hook.

```javascript
const mp = new MoonPipe()
  .onIdle(() => {
    console.log('is NOT loading anymore')
  })
```

### onBusyBy
The `onBusyBy` hook is like the `onBusy` one but for Splitters. It can be added only after a call to the `splitBy` method and before the corresponding call to the `join` method. It will be called separately for every internal pipe created by the Splitter, every time the pipe goes from an `idle` state to a `busy` state. The callback provided by you is supposed to be `synchronous`. It takes one argument - the same one that is returned by the classification function provided to the `splitBy` method. There can be **only one** onBusyBy hook per Splitter.
```javascript
const mp = new MoonPipe()
  .splitBy(2, value => value.color)
  .onBusyBy(color => {
    console.log('// onBusyBy', color)
  })
  .throttleMap(async value => value)
  .onIdleBy(color => {
    console.log('// onIdleBy', color)
  })
  .join()
```

### onIdleBy
The `onIdleBy` hook is like the `onIdle` one but for Splitters. It is a partner in crime, and behaves much like the `onBusyBy` hook. See above.

---

One use case for the `onBusy/onIdle` hooks that I know is to show a spinner in the `onBusy` hook, and hide it in the `onIdle` hook.

```javascript
const mp = new MoonPipe()
  .onBusy(() => {
    console.log('is loading')
  })
  .onIdle(() => {
    console.log('is NOT loading anymore')
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump(1)
mp.pump(2)

// is loading
// output: 1
// output: 2
// is NOT loading anymore
```
## History
The most recently pumped value is kept in the history buffer. It can be pumped again with the `rePumpLast` method. The method is useful when you, for example, manually [update the cache](#cache-invalidation) and want to push the new value through afterwards. It does nothing when the history buffer is empty.
```javascript
const mp = new MoonPipe()
  .queueTap(val => console.log('// out: ', val))

mp.pump('echo')
mp.rePumpLast() // <--- HERE
// out:  echo
// out:  echo
```

## As Promise
An instance of MoonPipe can be `awaited` with the `getOnIdlePromise()` method.
```javascript
async function example() {
  const mp = new MoonPipe().queueTap(() => {})
  mp.pump(1)
  await mp.getOnIdlePromise()
}
```
The `getOnIdlePromise()` method returns a `Promise` that is resolved when the pipe has nothing more to do. The OnIdlePromise is meant only as a simple synchronization mechanism. It is never rejected, as errors do not propagate to the `onIdle` stage. It is resolved when the pipe turns `idle`.

Beware that the pipe turns `idle` only if it first was `busy`. If you await a pipe that has never been `busy`, you will wait forever. A similar gotcha you will encounter when your pipe consists of only `synchronous` valves. In this case you will not be able to `await` the pipe, because the pipe turns `idle` even before you get to call the `getOnidlepromise()` method.

## Clearing out buffers
Sometimes you may want to stop the pipe, or a valve, from what it's doing and remove every pumped value that waits for its turn. Methods that do that are `buffersClearAll()`, and `buffersClearOne(valveName)`. `buffersClearAll()` removes every value from the entire pipe, whereas `buffersClearOne(valveName)` removes every value from a single valve or a single splitter. In addition to clearing out buffers, the mentioned methods cancel `active promises` in `PromiseValves`, and `active timeouts` in `TimeValves`. Notice that the `splitBy` valve is special, as clearing buffers (or the cache) on it applies to everything that's between `splitBy` and `join`.
```javascript
const mp = new MoonPipe()
  .cancelLazy(1000, {name: 'cl'})
  .queueMap(async (val) => val, {name: 'qm'})
  .splitBy(1, () => 'whatever', {name: 'splitter'})
  .queueTap(async (val) => val, {name: 'qt'})
  .queueTap(async (val) => val)
  .join()
  .queueError(async (err) => {})

mp.buffersClearOne('qm') // this will clear out the buffer in the valve named 'qm'
mp.buffersClearOne('splitter') // this will clear out everything that's between splitBy() and join()
mp.buffersClearOne('qt') // this will clear out the buffer in the valve named 'qt'
mp.buffersClearAll()  // this will clear out buffers in all the valves
```

## SplitBy/Join
Sometimes it is desirable to split the input into groups based on some factor, and give each group a separate pipe. The `splitBy` valve does exactly that. It splits the incoming data by a factor that can be defined in the classification function, which is passed to the `splitBy` valve as the second argument. The first argument passed to the `splitBy` valve is the number of pipes that are going to be created under the hood. The second argument is a classification function. The classification function takes the pumped value as the first argument and returns the label of a bucket the data will be put into. Every data bucket will be processed by a dedicated pipe in separation from the other buckets. For example `.splitBy(2, value => value.id)` will create 2 pipes, and will group the incoming values by the `value.id`.

It is perfectly fine to have more groups than the number of underlying pipes. If there are more groups than the pipes, some of the groups will wait for a free pipe before they move on.

When you are done with splitting, use the `join()` valve to collect the results. Everything that is between `splitBy` and `join` constitutes a full-fledged pipe.

The `splitBy/join` pattern can be useful when e.g. you make a few consecutive PUT requests, and you want to have one pipe per object id. E.g:
```javascript
const mp = new MoonPipe()
  .splitBy(2, value => value.id)     //  /\
  .throttleMap(async value => value) //  ||
  .join()                            //  \/
  .queueTap(value => {
    console.log('//', value)
  })

console.log('// output:')
mp.pump({ id: 1, n: 'start' })
mp.pump({ id: 1, n: 'middle' })
mp.pump({ id: 1, n: 'end' })
mp.pump({ id: 2, n: 'start' })
mp.pump({ id: 2, n: 'middle' })
mp.pump({ id: 2, n: 'end' })

// output:
// { id: 1, n: 'start' }
// { id: 2, n: 'start' }
// { id: 1, n: 'end' }
// { id: 2, n: 'end' }
```

Note that the `splitBy` valves can be nested. The following example creates 2 concurrent pipes, and for each of the 2 created pipes creates 2 more, which gives you a fork with 4 teeth.
```javascript
const mp = new MoonPipe()
  .splitBy(2, value => value.color) //   /\
  .splitBy(2, value => value.id)    //  /\/\
  .queueTap(value => {})            //  ||||
  .queueTap(value => {})            //  ||||
  .join()                           //  \/\/
  .join()                           //   \/
```

Also note that inner pipes behave a lot like regular valves. This means that errors from inner pipes are propagated to the parent pipe. However, if you decide to handle errors in inner pipes, errors will not be propagated to the parent pipe and the parent pipe will continue operating in the `DATA` mode, while the inner pipes will be handling errors in the `ERROR` mode.

*Cache in splitters (when enabled) is nondeterministic. If you want a deterministic cache, set the concurrency parameter to 1, e.g. `.splitBy(1, value => value.id)`*

## Presets explained
### Base Preset Params (These params are common to both the TimeValves and PromiseValves):
- `name` - A name that is used when the valve is added to the pipe
- `maxBufferSize` - the size of the internal buffer
- `bufferType`- describes the order in which values are processed
  - `QUEUE` - values are processed one after another
- `overflowAction` - an action taken when the buffer is full
  - `EMIT_ERROR` - a `BufferOverflowError` error is emitted
  - `SHIFT` - the first value from the buffer is removed
  - `SKIP` - new values are skipped (not added to the buffer and so never processed)
  - `SLICE` - In the SLICE mode values are packed into an array which is later processed as a whole. When the array is full, a new array is created.
- `squashDownTo` - A function that, if set, makes the valve trim the buffer from the first value returned by the function to the end of the buffer.
- `outputChannel` (**DEPRECATED**) - the channel that regular data will be emitted to. Unexpected errors are always emitted to the `ERROR` channel. Data can be emitted to either `DATA` or `ERROR`
  - `DATA` - data is emitted to the `DATA` channel, unexpected errors are emitted to the `ERROR` channel
  - `ERROR` - both data and errors are emitted to the `ERROR` channel

### TimeValve Preset Params:
- `resolveType` - determines when the value is emitted
  - `LAZY` - first the timeout is set. The value is emitted only after the timeout ends.
  - `EAGER` - if there's no active timeout, the value is emitted immediately and the timeout is set. Otherwise the value is emitted after the previous timeout ends.
- `cancelOnPump` - if `true`, the active timeout is reset on every new value

### PromiseValve Preset Params:
- `resolveType` - determines what value is emitted
  - `MAP` - the result of the promise is emitted
  - `TAP` - the value that is fed into the promise is emitted
- `cancelOnPump` - if `true`, the active promise is canceled on every new value
- `timeoutMs` - time after which the promise is canceled and a `TimeoutError` is emitted. `timeoutMs: 0` means disabled.
- `poolSize` - number of promises running concurrently
- `cache` - if `true`, the result of the promise will be cached
- `hashFunction` - a function that takes the pumped `value` and returns the `key` at witch the result will be cached. Defaults to `value => value`
- `repeatPredicate` - a synchronous function which takes an `attemptsMade` counter as the first argument and an `error` as the second one. It returns `true` or `false`.
- `repeatBackoffFactory` - a function that returns an instance of a `Backoff` class. Currently `ConstantBackoff` and `LinearBackoff` classes are implemented.

Predefined presets can be found in the `TimeValve.js` and `PromiseValve.js` files.

## Utilities
### delayPromise
`delayPromise` is a function that takes a number of milliseconds as the first argument and returns a promise which is resolved after the provided number of milliseconds. Normally you don't need it, as valves like `queueLazy` can do a similar thing. However, it can be useful for debugging or playing around.
```javascript
const { delayPromise } = require('moonpipe')
async function run() {
  await delayPromise(2000)
}
```

## TypeScript
TypeScript is supported via declaration files, which are generated from JSDoc comments, and included in the `./types` folder. Proper types are defined only for the public part of the `MoonPipe` class, but they should cover all common use cases. The central point is the `MoonPipe<D_IN, D_OUT>` class. It takes 2 generic parameters `D_IN` and `D_OUT`. The first one is what you pump to the pipe: `mp.pump(value: D_IN)`, the second one (`D_OUT`) is the input type of the next valve. You don't have to worry about the `D_OUT` param. The important thing is that when you declare your pipe, both `D_IN` and `D_OUT` params should be set to the same type.
```typescript
let m1: MoonPipe<number, number>
let m2: MoonPipe<string, string>
```
Another important thing is that, if you want to get the types correctly, you can either cast and chain, or declare and defer chaining. Declaring the type and chaining right away is not possible because the declared type must match the type returned by the last method in the chain, and the last method in the chain will not now the `D_IN` type if it hasn't been declared beforehand.
```typescript
// correct:
// create an instance, cast it, and start chaining right away
const m0 = (new MoonPipe() as MoonPipe<number, number>)
  .queueMap(async val => true)
  .queueMap(async val => 'a')

// correct:
// declare the type, and create an instantiate first
const m1: MoonPipe<number, number> = new MoonPipe()
// start chaining later
m1.queueMap(async val => true)
  .queueMap(async val => 'a')

// wrong:
// declare the type, create an instance, and start chaining right away
const m2: MoonPipe<unknown, string> = new MoonPipe()
  .queueMap(async () => true)
  .queueMap(async () => 'a')
// The type of the pipe in this example is determined by the last call
// to the queueMap method. The last queueMap changes the type of the
// pipe to MoonPipe<D_IN, string>. D_IN was not known at the time when
// new MoonPipe was instantiated, and so it will stay unknown forever.
```

### Type system limitations
MoonPipe is a JavaScript library. JavaScript type system is more flexible than TypeScript. Because of that some of the types cannot be represented correctly. Here is a full list of things that are off:
- The return type of the `pipe` method and the `flatten` method is `MoonPipe<D_IN, any>`. The type information carried by the `D_OUT` param is swallowed when these methods are used.
- The `flatten` method is not type safe. In a perfect world, you shouldn't be able to call it when the `D_OUT` param is not an `Array`. The current implementation always lets you do this, which means that it can emit an error if you are not careful.

## Versioning
The package follows **Semantic Versioning**, which means that given a version number `MAJOR.MINOR.PATCH`, the components will be incremented as follows:
1. `MAJOR` version when making incompatible API changes
2. `MINOR` version when adding functionality in a backward compatible manner
3. `PATCH` version when making backward compatible bug fixes

## Contributing
By contributing your code to this project, you agree to license your contribution under the MIT license.
