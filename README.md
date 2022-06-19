# Mud Pipe
Compose promises in a structured way.

- [TL;DR](#tldr)
- [Predefined operators](#predefined-operators)
- [Error handling](#error-handling)
- [Clearing out buffers](#clearing-out-buffers)
- [Custom operators](#custom-operators)
- [Presets explained](#presets-explained)
  - [Base Preset Params](#base-preset-params)
  - [TimeValve Preset Params](#timevalve-preset-params)
  - [PromiseValve Preset Params](#promisevalve-preset-params)
- [Cache in PromiseValves](#cache-in-promisevalves)
- [Repeating on Error](#repeating-on-an-error)

### TL;DR

```javascript
const mp = new MudPipe()
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
### Predefined operators
```
queueTap    queueMap    queueEager    queueLazy    queueError
cancelTap   cancelMap   cancelEager   cancelLazy   cancelError
throttleTap throttleMap throttleEager throttleLazy throttleError
skipTap     skipMap     skipEager     skipLazy     skipError
sliceTap    sliceMap    sliceEager    sliceLazy
poolTap     poolMap
flatten     map         filter
```

Among the predefined operators there are 3 synchronous operators **(flatten, map, filter)**, and 20+4+2 asynchronous operators. The names of the asynchronous operators consist of a prefix and a suffix. There are 5 different prefixes **(queue, cancel, throttle, skip, slice)**, and 5 different suffixes **(Map, Tap, Eager, Lazy, Error)**.

The operators with the **Map**, **Tap**, and **Error** suffixes operate on **Promises**, whereas the operators with the **Eager** and **Lazy** suffixes operate on **Timeouts**.

Prefixes:
- **queue** - queues every pumped value, and processes one after another
- **cancel** - cancels the running promise/timeout and replaces the current value with the new one
- **throttle** - replaces the value next in line with the new one, and does not cancel the promise/timeout
- **skip** - skips every new value until the promise/timeout finishes
- **slice** - packs values into arrays of defined slice size

Suffixes:
- **Map** - pumps the result of a promise to the next valve
- **Tap** - waits for a promise to complete and pumps the input value
- **Error** - it's like the Map suffix, but it is used only when the pipe operates in an Error mode. It is used to catch errors.
- **Eager** - pumps the input value, and waits until the time passes before taking on the next value
- **Lazy** - waits until the time passes and pumps the first value in line

The names of the 2 special asynchronous operators that I haven't mentioned so far are **poolTap** and **poolMap**. These 2 let you run a specified number of promises concurrently. The `poolSize` parameter is the first parameter to these operators.
```
const mp = new MudPipe()
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

### Error handling
When an error is thrown by one of the normal operators, the pipe switches its active channel to the `CHANNEL_TYPE.ERROR`. Now it operates in an `error mode` which means that no new promises will be created until the active channel switches back to the `CHANNEL_TYPE.DATA`. Existing promises will be able to finish though, which can result in either a valid response or a new error. Valid responses will be put off for later, and errors will be pumped to the `ErrorValves`. The active channel will be switched back to the `CHANNEL_TYPE.DATA` when there are no more errors to handle.

There are 4 predefined operators that can be used to handle errors. They all behave like their brothers from the `Map` family with that difference that they operate only in the `error mode`. The most common one is the `queueError` operator, which handles errors one after another. Another one that may be useful is the `skipError` operator. It handles the first error, and let all the subsequent ones slide. Other operators that can be used for error handling are `cancelError` and `throttleError`.

If there are no error handlers, errors will be silently ignored.
```javascript
const mp = new MudPipe()
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

out 1: a
error: thrown in queueTap
out 2: b
```

### Clearing out buffers
There are two methods that you can use to clear out `buffers`. These are `buffersClearAll()`, and `buffersClearOne(valveIndex)`. The `valveIndex` is a `0-based` index of a valve plugged into the pipe. In the following code the cancelLazy valve has index = 0.
```
const mp = new MudPipe()
  .cancelLazy(1000)             // valveIndex = 0
  .queueMap(async (val) => val) // valveIndex = 1
  .queueTap(async (val) => {    // valveIndex = 2
    throw 'thrown in queueTap'
  })
  .queueError(async (err) => {  // valveIndex = 3
    console.log('error:', err)
  })

mp.buffersClearOne(1) // this will clear out the buffer in the queueMap valve
mp.buffersClearAll() // this will clear out buffers in all the valves
```
In addition to clearing out buffers, the mentioned methods cancel `active promises` in `PromiseValves`, and `active timeouts` in `TimeValves`.

### Custom operators
You can create your own flavors of `TimeValve` and `PromiseValve`, and use the `.pipe` operator to add them to an instance of the `MudPipe`. Look at [Presets explained](#presets-explained) for additional info about presets.

```javascript
const preset = {
  maxBufferSize: 3,
  bufferType: BUFFER_TYPE.QUEUE,
  overflowAction: OVERFLOW_ACTION.SHIFT,
  resolveType: TIME_RESOLVE_TYPE.LAZY,
  cancelOnPump: false,
}
const customTimeValve = new TimeValve(preset, 1000)
const mp = new MudPipe()
  .pipe(customTimeValve)
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
```
mp.pipe(valve, CHANNEL_TYPE.ERROR)
```

### Presets explained
##### Base Preset Params:
- `maxBufferSize` - the size of the internal buffer
- `bufferType`- describes the sequence in which values are processed
  - `QUEUE` - values are processed one after another
- `overflowAction` - an action taken when the buffer is full
  - `EMIT_ERROR` - a `BufferOverflowError` error is emitted
  - `SHIFT` - the first value from the buffer is removed
  - `SKIP` - new values are skipped (not added to the buffer and so never processed)
  - `SLICE` - In the SLICE mode values are packed into an array which is later processed as a whole. When the array is full, a new array is created.

##### TimeValve Preset Params:
- `resolveType` - determines when the value is emitted
  - `LAZY` - first the timeout is set. The value is emitted only after the timeout ends.
  - `EAGER` - if there's no active timeout, the value is emitted immediately. Otherwise the value is emitted after the previous timeout ends.
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
- `repeatPredicate` - an `async` function which takes an `attemptsMade` counter as the first argument and an `error` as the second one. It returns `true` or `false`.

Predefined presets can be found in the `TimeValve.js` and `PromiseValve.js` for example presets.

### Cache in PromiseValves
You can cache the result of a promise. In order to do that you just add a `cache: true` param to the options and you are done. Results are cached in a hash map, where the value provided is used as the key. You can customize the hash function if you don't like how the keys are derived (see down below).
```javascript
const mp = new MudPipe()
  .queueMap(async (val) => {
    console.log('...side effect')
    return 'mapped_' + val
  }, {
    cache: true,
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
You can clear the cache later with one of these:
```javascript
mp.cacheClearAll() // clears the entire cache in all valves.
mp.cacheClearOne(0) // clears the entire cache in the valve at the index 0.
mp.cacheClearOne(1, 'a') // clears only the entry at the key derived from the value 'a' in the valve at the index 1.
mp.cacheClearOne(2, 'a', 'b') // clears entries at keys derived from values 'a' and 'b' in the valve at the index 2.
```
You can also use a custom hash function to generate custom keys at which the values will be stored in cache.
```javascript
const mp = new MudPipe()
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

### Repeating on an error
You can use a `repeatPredicate` (`async (attemptsMade, error) => false` by default) which takes the attempts counter as the first argument and an error as the second one  and returns true if the promise should be retried. In order for a promise to be retired the `repeatPredicate` must return `true`.

If `repeatPredicate` throws an error, the promise is automatically rejected and will not be retried anymore.

The `repeatPredicate` is `async` to make it future proof, but keep in mind that the `timeoutMs` is not applied to it which means that if it hangs, there's nothing that could cancel it. Make sure that you understand the risk, before making a call to an external service from the `repeatPredicate`.
```javascript
const mp = new MudPipe()
  .queueTap(async (val) => {
    console.log('// output:', val)
    throw 'err_' + val
  }, {
    repeatPredicate: async (attemptsMade, err) => {
      return attemptsMade <= 3 && err === 'err_b'
    },
  })
  .queueError(async (err) => {
    console.log('// error:', err)
  })

mp.pump('a')
mp.pump('b')
mp.pump('c')

// output: a
// error: err_a
// output: b
// output: b
// output: b
// output: b
// error: err_b
// output: c
// error: err_c
```
