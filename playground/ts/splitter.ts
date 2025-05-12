import { MoonPipe } from '../../index.js'

const m1 = (new MoonPipe() as MoonPipe<number, number>)
  .queueMap(async val => 2)
  .splitBy(2, val => val.toExponential())
  .queueMap(async val => val.toFixed())
  .join()
  .queueTap(async val => val.charAt(0))
