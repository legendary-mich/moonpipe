import { MoonPipe } from '../../index.js'

const m1 = (new MoonPipe() as MoonPipe<number, number>)
  .queueMap(async val => true, {
    hashFunction: (val: number) => val,
    squashDownTo: (val: number) => val,
  })
  .queueTap(async val => 's', {
    hashFunction: (val: boolean) => val,
    squashDownTo: (val: boolean) => val,
  })
  .queueMap(async val => 's', {
    hashFunction: (val: boolean) => val,
    squashDownTo: (val: boolean) => val,
    repeatVerbose: true,
  })
  .queueTap(async val => 2, {
    hashFunction: (val: string) => val,
    squashDownTo: (val: string) => val,
  })
