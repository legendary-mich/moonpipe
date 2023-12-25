# Moon Pipe
Throttle streams of data while passing them through promises an timers. Use various valves to discard redundant data points.

- [TL;DR](#tldr)
- [Predefined valves](#predefined-valves)
- [Overriding predefined valves](#overriding-predefined-valves)
- [Error handling](#error-handling)
- [Hooks](#hooks)
  - [onBusyTap](#onbusytap)
  - [onIdle](#onidle)
- [Clearing out buffers](#clearing-out-buffers)
- [PromiseValves](#promisevalves)
  - [Cache](#cache-in-promisevalves)
  - [Timeout](#timeout-in-promisevalves)
  - [Repeating on Error](#repeating-on-error-in-promisevalves)
  - [onCancel callback](#oncancel-callback)
  - [Pooling](#pooling-in-promisevalves)
- [SplitBy/Join](#splitbyjoin)
- [Custom valves](#custom-valves)
- [Presets explained](#presets-explained)
  - [Base Preset Params](#base-preset-params-these-params-are-common-to-both-the-timevalves-and-promisevalves)
  - [TimeValve Preset Params](#timevalve-preset-params)
  - [PromiseValve Preset Params](#promisevalve-preset-params)
- [Utilities](#utilities)
- [Contributing](#contributing)

### TL;DR

```bash
npm install moonpipe
```
```javascript
const { MoonPipe } = require('moonpipe')
const mp = new MoonPipe()
  .cancelLazy(1000) // in other libs known as debounce
  .queueMap(async (val) => 'initial_' + val)
  .queueTap(async (val) => {
    console.log('output:', val)
    throw 'thrown in queueTap'
  })
  .queueError(async (err) => {
    console.log('error:', err)
  })

mp.pump('a')
mp.pump('b')
mp.pump('c')
mp.pump('d')

// output: initial_d
// error: thrown in queueTap
```
### Predefined valves
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

Among the predefined valves there are 4 synchronous valves **(flatten, map, filter, filterError)**, and 20+4+2+2 asynchronous valves. The names of the asynchronous valves consist of a prefix and a suffix. There are 5 different prefixes **(queue, cancel, throttle, skip, slice)**, and 5 different suffixes **(Map, Tap, Eager, Lazy, Error)**.

The valves with the **Map**, **Tap**, and **Error** suffixes operate on **Promises**, whereas the valves with the **Eager** and **Lazy** suffixes operate on **Timeouts**.

Prefixes:
- **queue** - queues every pumped value, and processes one after another
- **cancel** - cancels the running promise/timeout and replaces the current value with the new one
- **throttle** - replaces the value next in line with the new one, and does not cancel the promise/timeout
- **skip** - skips every new value until the promise/timeout finishes
- **slice** - packs values into an array of the defined slice size

Suffixes:
- **Map** - pumps the result of a promise to the next valve
- **Tap** - waits for a promise to complete and pumps the input value
- **Error** - it's like the Map suffix, but it is used only when the pipe operates in the Error mode. It is used to catch errors.
- **Eager** - pumps the input value, and waits until the time passes before taking on the next value
- **Lazy** - waits until the time passes and pumps the first value in line

Here is a combined example showing one of each of the basic valve types.
```javascript
const { MoonPipe } = require('moonpipe')
const mp = new MoonPipe()
  // time-based valves take a number of milliseconds as the first argument
  .queueLazy(300)
  // promise-based valves take a function which returns a promise
  .queueMap(async (val) => val + 1000)
  // errors thrown from any of the promise-based valves are
  // propagated through the error channel to the first error handler.
  .queueTap(async (val) => { if (val === 'what?1000') throw new Error('ha!') })
  // the filter valve takes a function which returns a `boolean` value
  .filter((val) => val % 2 === 0)
  // the map valve takes a function which returns an arbitrary value
  .map((val) => [val, val])
  // the flatten valve does not take any arguments
  .flatten()
  // error valves take a function which returns a promise
  .queueError(async (err) => 'error handled: ' + err.message)
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump(1)
mp.pump(2)
mp.pump('what?')
mp.pump(3)
mp.pump(4)

// output: 1002
// output: 1002
// output: error handled: ha!
// output: 1004
// output: 1004
```

This example presents one of the **slice** valves:
```javascript
const { MoonPipe } = require('moonpipe')
const mp = new MoonPipe()
  // slice valves take the sliceSize as the first argument and a
  // promise as the second one.
  .sliceMap(3, async (val) => val)
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump(1)
mp.pump(2)
mp.pump(3)
mp.pump(4)

// output: [ 1, 2, 3 ]
// output: [ 4 ]
```

The names of the 2 special asynchronous valves that I haven't mentioned so far are **poolTap** and **poolMap**. These 2 let you run a specified number of promises concurrently. The `poolSize` parameter is the first parameter to these valves.
```javascript
const { MoonPipe } = require('moonpipe')
const mp = new MoonPipe()
  .poolMap(2, async (val) => {
    return 'mapped_' + val
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump('a')
mp.pump('b')
mp.pump('c')
```

### Overriding predefined valves

Every of the predefined valves can be overridden with a set of options. The **promise-based** valves accept options specific to the `PromiseValve`. The **time-based** valves accept options specific to the `TimeValves`. The `options` parameter is always passed in as **the last argument**. I'm going to show you a simple example here. For the full list of options see the [Presets explained](#presets-explained) section.

```javascript
const { MoonPipe } = require('moonpipe')

const mp = new MoonPipe()
  .throttleMap(async (val) => 'initial_' + val, {
    maxBufferSize: 2, // <---- overridden HERE
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })
```

### Error handling
When an error is thrown by one of the normal valves, the pipe switches its active channel to the `CHANNEL_TYPE.ERROR`. Now it operates in an `error mode` which means that no new promises will be created until the active channel switches back to the `CHANNEL_TYPE.DATA`. Existing promises will be able to finish though, which can result in either a valid response or a new error. Valid responses will be put off for later, and errors will be pumped to the `ErrorValves`. The active channel will be switched back to the `CHANNEL_TYPE.DATA` when there are no more errors to handle.

There are 4 predefined valves that can be used to handle errors. They all behave like their brothers from the `Map` family with that difference that they operate only in the `error mode`. The most common one is the `queueError` valve, which handles errors one after another. Another one that may be useful is the `skipError` valve. It handles the first error, and let all the subsequent ones slide. Other valves that can be used for error handling are `cancelError` and `throttleError`.

If there are no error handlers, errors will be silently ignored.
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

### Hooks

##### onBusyTap
The `onBusyTap` hook is called every time the pipe goes from an `idle` state to a `busy` state. The callback provided by you is supposed to be `synchronous`. It takes the pumped value as the first argument. **If it throws** an error, the error will be pumped to the **nearest error valve**. There can be **only one** onBusyTap hook.
```javascript
const mp = new MoonPipe()
  .onBusyTap((value) => {
    console.log('is loading', value)
  })
```

##### onIdle
The `onIdle` hook is called every time the pipe goes from a `busy` state to an `idle` state. The callback provided by you is supposed to be `synchronous`. It does NOT take any value as the first argument. **If it throws** an error, the error will be **silently ignored**. There can be **only one** onIdle hook.

```javascript
const mp = new MoonPipe()
  .onIdle(() => {
    console.log('is NOT loading anymore')
  })
```

One use case for the `onBusyTap/onIdle` hooks that I know is to show a spinner in the `onBusyTap` hook, and hide it in the `onIdle` hook.

```javascript
const mp = new MoonPipe()
  .onBusyTap((value) => {
    console.log('is loading', value)
  })
  .onIdle(() => {
    console.log('is NOT loading anymore')
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump(1)
mp.pump(2)

// is loading 1
// output: 1
// output: 2
// is NOT loading anymore
```

### Clearing out buffers
There are two methods that you can use to clear out `buffers`. These are `buffersClearAll()`, and `buffersClearOne(valveName)`. The `valveName` is a `string` passed into the valve constructor under the `name` field. Notice that the `splitBy` valve is different, as clearing buffers (or cache) on it applies to everything that's between `splitBy` and `join`.
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
In addition to clearing out buffers, the mentioned methods cancel `active promises` in `PromiseValves`, and `active timeouts` in `TimeValves`.

### PromiseValves
### Cache in PromiseValves
You can cache the result of a promise. In order to do that you just add a `cache: true` param to the options and you are done. Results are cached in a hash map, where the value provided is used as the key. You can customize the hash function if you don't like how the keys are derived (see down below).
```javascript
const { MoonPipe } = require('moonpipe')
const mp = new MoonPipe()
  .queueMap(async (val) => {
    console.log('...side effect')
    return 'mapped_' + val
  }, {
    cache: true, // <------ cache is enabled HERE
    name: 'bigJohn', // <-- a name that you can use to wipe out the cache in this particular valve (see below)
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
You can clear the cache later with one of the following (look at the [Clearing out buffers](#clearing-out-buffers) section for the info on how to add names to the valves):
```javascript
mp.cacheClearAll() // clears the entire cache in all valves.
mp.cacheClearOne('bigJohn') // clears the entire cache in the valve named bigJohn.
mp.cacheClearOne('littleJohn', 'a') // clears only the entry at the key derived from the value 'a' in the valve named littleJohn.
mp.cacheClearOne('oldJohn', 'a', 'b') // clears entries at keys derived from values 'a' and 'b' in the valve at the valve named oldJohn.
```

You can also use a custom hash function to generate custom keys at which the values will be stored in cache.
```javascript
const { MoonPipe } = require('moonpipe')
const mp = new MoonPipe()
  .queueMap(async (val) => {
    console.log('...side effect')
    return 'mapped_' + val
  }, {
    cache: true,
    hashFunction: (val) => val.toLowerCase(),
  })
  .queueTap(async (val) => {
    console.log('output:', val)
  })

mp.pump('A')
mp.pump('a')

// ...side effect
// output: mapped_A
// output: mapped_A <-- a value from the cache at the key 'a'
```

### Timeout in PromiseValves
You can provide a `timeoutMs` param to every promise-based valve. If the promise is not settled within the provided number of milliseconds, it will be rejected with a `TimeoutError`.
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
You can use a `repeatPredicate` which takes an `attemptsMade` counter as the first argument, an `error` as the second one, and returns a `boolean` value which signifies whether the promise should be retried or not.

If a `repeatPredicate` throws an error, the promise is automatically rejected and will not be retried anymore.

Since moonpipe **v2.0.0** the `repeatPredicate` is expected to be **synchronous** and will not be awaited.

```javascript
const { MoonPipe } = require('moonpipe')
const mp = new MoonPipe()
  .queueTap(async (val) => {
    console.log('// side:', val)
    throw 'err_' + val
  }, {
    repeatPredicate: (attemptsMade, err) => {
      return attemptsMade <= 3 && err === 'err_b'
    },
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

### onCancel callback
Sometimes you may want to do some cleanup when the promise is being canceled. In order to do that you can utilize the `onCancel` callback which can be attached to the `promiseContext` that is passed as the second argument to the promise factory function. What follows is an example of how to clear a timeout from within one of the `cancel` promise valves.

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
Promises can be run concurrently. In order to do that you can either use the `poolMap`, `poolTap` valves (see the [Predefined valves](#predefined-valves) section for an example), or override the `poolSize` param in any of the promise-based valves.

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

mp.pump('a')
mp.pump('b')
mp.pump('c')
```

### SplitBy/Join
Sometimes it is useful to run a few pipes of the same type concurrently. In that case you can use the `splitBy` valve to split the incoming data by a factor that you define in the classification function. The first argument passed to the `splitBy` function is the number of pipes that are going to be created under the hood. The second argument is a classification function. The classification function takes the pumped value as the first argument and returns the label of a bucket the data will be put into. Every data bucket will be processed by a dedicated pipe in separation from the other buckets. For example `.splitBy(2, value => value.id)` will create 2 pipes, and will group the incoming values by the `value.id`.

It is perfectly fine to have more groups than the number of underlying pipes. If there are more groups than the pipes, some of the groups will wait for a free pipe before they move on.

When you are done with splitting, use the `join()` valve to collect the results. Everything that is between `splitBy` and `join` constitutes a full-fledged pipe.

The `splitBy/join` pattern can be useful when e.g. you make a few consecutive PUT requests, and you want to have one pipe per object id. E.g:
```javascript
const mp = new MoonPipe()
  .splitBy(2, value => value.id)     //  /\
  .throttleMap(async value => value) //  ||
  .join()                            //  \/
  .queueTap(value => {
    console.log('// queue   ', value)
  })

mp.pump({ id: 1, n: 'a' })
mp.pump({ id: 1, n: 'b' })
mp.pump({ id: 1, n: 'c' })
mp.pump({ id: 2, n: 'e' })
mp.pump({ id: 2, n: 'f' })
mp.pump({ id: 2, n: 'g' })

// output:
// queue    { id: 1, n: 'c' }
// queue    { id: 2, n: 'g' }
```

Note that the `splitBy` valves can be nested. The following example creates 2 concurrent pipes, and for each of the 2 created pipes creates another 2, which gives you a fork with 4 teeth.
```javascript
const mp = new MoonPipe()
  .splitBy(2, value => value.id) //   /\
  .splitBy(2, value => value.id) //  /\/\
  .queueTap(value => {})         //  ||||
  .queueTap(value => {})         //  ||||
  .join()                        //  \/\/
  .join()                        //   \/
```

Also note that inner pipes behave like regular valves. This means that errors from inner pipes are propagated to the outer pipes, which changes the active channel on the outer pipes to the `ERROR` one. However, if you decide to handle errors on the inner pipes, errors will not be propagated to the outer pipes and the outer pipes will continue operating in the `DATA` mode, while the inner pipes will be handling errors in the `ERROR` mode (active channel = ERROR).

### Custom valves
You can create your own flavors of the `TimeValve` and `PromiseValve`, and use the `.pipe` method to add them to an instance of the MoonPipe. Look at [Presets explained](#presets-explained) for additional info about the presets. Here I will show you an example of a time-based valve which is similar the the `throttleLazy` valve, but has a bigger `maxBufferSize`.

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

The `pipe` method accepts a `CHANNEL_TYPE` as the second argument. By default it is set to `CHANNEL_TYPE.DATA`, so you don't have to worry about it. If you however want to use a valve as an error handler, set the `CHANNEL_TYPE` to the `ERROR` value.
```javascript
mp.pipe(valve, CHANNEL_TYPE.ERROR)
```

### Presets explained
##### Base Preset Params (These params are common to both the TimeValves and PromiseValves):
- `name` - A name that is used when the valve is added to the pipe
- `maxBufferSize` - the size of the internal buffer
- `bufferType`- describes the order in which values are processed
  - `QUEUE` - values are processed one after another
- `overflowAction` - an action taken when the buffer is full
  - `EMIT_ERROR` - a `BufferOverflowError` error is emitted
  - `SHIFT` - the first value from the buffer is removed
  - `SKIP` - new values are skipped (not added to the buffer and so never processed)
  - `SLICE` - In the SLICE mode values are packed into an array which is later processed as a whole. When the array is full, a new array is created.
- `outputChannel` - the channel that regular data will be emitted to. Unexpected errors are always emitted to the `ERROR` channel. Data can be emitted to either `DATA` or `ERROR`
  - `DATA` - data is emitted to the `DATA` channel, unexpected errors are emitted to the `ERROR` channel
  - `ERROR` - both data and errors are emitted to the `ERROR` channel

##### TimeValve Preset Params:
- `resolveType` - determines when the value is emitted
  - `LAZY` - first the timeout is set. The value is emitted only after the timeout ends.
  - `EAGER` - if there's no active timeout, the value is emitted immediately and the timeout is set. Otherwise the value is emitted after the previous timeout ends.
- `cancelOnPump` - if `true`, the active timeout is reset on every new value

##### PromiseValve Preset Params:
- `resolveType` - determines what value is emitted
  - `MAP` - the result of the promise is emitted
  - `TAP` - the value that is fed into the promise is emitted
- `cancelOnPump` - if `true`, the active promise is canceled on every new value
- `timeoutMs` - time after which the promise is canceled and a `TimeoutError` is emitted
- `poolSize` - number of promises running concurrently
- `cache` - if `true`, the result of the promise will be cached
- `hashFunction` - a function from a `value` to the `key` at witch the result will be cached. Defaults to `value => value`
- `repeatPredicate` - a synchronous function which takes an `attemptsMade` counter as the first argument and an `error` as the second one. It returns `true` or `false`.

Predefined presets can be found in the `TimeValve.js` and `PromiseValve.js` files.

### Utilities
##### delayPromise
`delayPromise` is a function that takes the number of milliseconds as the first argument and returns a promise which is resolved after the provided number of milliseconds. Normally you don't need it, as valves like `queueLazy` can do a similar thing. However, it can be useful for debugging or playing around.
```javascript
const { delayPromise } = require('moonpipe')
async function run() {
  await delayPromise(2000)
}
```

## Contributing
By contributing your code to this project, you agree to license your contribution under the MIT license.
