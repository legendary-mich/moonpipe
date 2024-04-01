import { MoonPipe } from '../../index.js'

// correct:
// instantiate first
const m1: MoonPipe<number, number> = new MoonPipe()
// start chaining later
m1.queueMap(async val => true)
  .queueMap(async val => 'a')

// wrong:
// instantiate and start chaining right away
const m2: MoonPipe<unknown, string> = new MoonPipe()
  .queueMap(async () => true)
  .queueMap(async () => 'a')
// The type of the pipe in this example is determined by the last call
// to the queueMap method. The last queueMap changes the type of the
// pipe to MoonPipe<D_IN, string>. D_IN was not known at the time when
// m2 was instantiated, and so it will stay unknown forever.
