# Mud Pipe
Compose promises in a structured way.

- [TL;DR](#tldr)
- [Predefined operators](#predefined-operators)
- [Error handling](#error-handling)
- [Custom operators](#custom-operators)
- [Presets explained](#presets-explained)
  - [Base Preset Params](#base-preset-params)
  - [TimeValve Preset Params](#timevalve-preset-params)
  - [PromiseValve Preset Params](#promisevalve-preset-params)
- [Cache in PromiseValves](#cache-in-promisevalves)

### TL;DR

```javascript
const mp = new MudPipe()
  .cancelLazy(1000) // in other libs known as debounce
  .queueMap(async (val) => 'initial_' + val)
  .queueTap(async (val) => {
    console.log('output:', val)
    throw 'thrown in queueTap'
  })
  .handleError(async (err) => {
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

Among the predefined operators there are 3 synchronous operators **(flatten, map, filter)**, and 16 asynchronous operators. The names of the asynchronous operators consist of a prefix and a suffix. There are 4 different prefixes **(queue, cancel, throttle, skip)**, and 4 different suffixes **(Map, Tap, Eager, Lazy)**.

The operators with the **Map** and **Tap** suffixes operate on **Promises**, whereas the operators with the **Eager** and **Lazy** suffixes operate on **Timeouts**.

Prefixes:
- **queue** - queues every pumped value, and processes one after another
- **cancel** - cancels the running promise/timeout and replaces the current value with the new one
- **throttle** - replaces the value next in line with the new one, and does not cancel the promise/timeout
- **skip** - skips every new value until the promise/timeout finishes

Suffixes:
- **Map** - pumps the result of a promise to the next valve
- **Tap** - waits for a promise to complete and pumps the input value
- **Eager** - pumps the input value, and waits until the time passes before taking on the next value
- **Lazy** - waits until the time passes and pumps the first value in line

### Error handling
There can be only one error handler, and it does not matter where you put it. It is perfectly fine to put it at the beginning.

```javascript
const mp = new MudPipe()
  .handleError(async (err) => {
    console.log('error:', err)
  })
  .queueTap(async (val) => {
    console.log('output:', val)
    throw 'thrown in queueTap'
  })

mp.pump('a')

// output: a
// error: thrown in queueTap
```

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

### Presets explained
##### Base Preset Params:
- `maxBufferSize` - the size of the internal buffer
- `bufferType`- describes the sequence in which values are processed
  - `QUEUE` - values are processed one after another
- `overflowAction` - an action taken when the buffer is full
  - `EMIT_ERROR` - a `BufferOverflowError` error is emitted
  - `SHIFT` - the first value from the buffer is removed
  - `SKIP` - new values are skipped (not added to the buffer and so never processed)

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
- `cache` - if `true`, the result of the promise will be cached
- `hashFunction` - a function from a `value` to the `key` at witch the result will be cached. Defaults to `value => value`
- `repeatOnError` - how many times the promise should be repeated in case of a failure

Predefined presets can be found in the `TimeValve.js` and `PromiseValve.js` for example presets.

### Cache in PromiseValves
You can cache the result of a promise. In order to do that you just add a `cache: true` param to the options and you are done.
```javascript
const mp = new MudPipe()
  .queueMap(async (val) => {
    console.log('...side effect')
    return 'mapped_' + val
  }, {
    cache: true
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
mp.cacheClear() // clears the entire cache
mp.cacheClearOne('a') // clears only the entry at the key 'a'
// Note that the cache is cleared in all the valves attatched to mp.
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
