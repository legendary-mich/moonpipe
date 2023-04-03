'use strict'

const { expect } = require('chai')
const { MoonPipe } = require('../index.js')
const { delayPromise } = require('./utils.js')

describe('MoonPipe.Buffers', () => {

  async function testInput(method, expected) {
    const result = []
    const mp = new MoonPipe()
      .queueTap(async () => {
        await delayPromise(10)
      })
      .queueTap(async () => {
        await delayPromise(20)
      })
      .queueTap(async (value) => {
        result.push(value)
      })
      .onBusyTap(async (value) => {
        result.push('on_busy_' + value)
      })
      .onIdle(async () => {
        result.push('on_idle')
      })

    mp.pump(1)
    mp.pump(2)
    mp.pump(3)
    mp.pump(4)

    await delayPromise(25)
    expect(mp.getChannelValveAt(0).valve.buffer).to.eql([4])
    expect(mp.getChannelValveAt(1).valve.buffer).to.eql([2])

    method(mp)
    expect(mp.getChannelValveAt(0).valve.buffer).to.eql(expected[0])
    expect(mp.getChannelValveAt(1).valve.buffer).to.eql(expected[1])
    await delayPromise(70)
    expect(result).to.eql(expected[2])
  }

  describe('ClearOne at 0', () => {
    it('clears out the first valve', async () => {
      return testInput(mp => mp.buffersClearOne(0), [
        [],
        [2],
        ['on_busy_1', 1, 2, 'on_idle'],
      ])
    })
  })

  describe('ClearOne at 1', () => {
    it('clears out the second valve', async () => {
      return testInput(mp => mp.buffersClearOne(1), [
        [4],
        [],
        ['on_busy_1', 3, 4, 'on_idle'],
      ])
    })
  })

  describe('ClearAll', () => {
    it('clears out both valves', async () => {
      return testInput(mp => mp.buffersClearAll(), [
        [],
        [],
        ['on_busy_1', 'on_idle'],
      ])
    })
  })

})

describe('MoonPipe.Buffers with Splitter', () => {

  async function testInput(method, expected) {
    const result = []
    const mp = new MoonPipe()
      .splitBy(1, () => 'wahtever')
      .queueTap(async () => {
        await delayPromise(10)
      })
      .queueTap(async () => {
        await delayPromise(20)
      })
      .join()
      .queueTap(async (value) => {
        result.push(value)
      })
      .onBusyTap(async (value) => {
        result.push('on_busy_' + value)
      })
      .onIdle(async () => {
        result.push('on_idle')
      })

    mp.pump(1)
    mp.pump(2)
    mp.pump(3)
    mp.pump(4)

    await delayPromise(25)
    const splitter = mp.getChannelValveAt(0).valve
    for (const smp of splitter.allPipes) {
      expect(smp.getChannelValveAt(0).valve.buffer).to.eql([4])
      expect(smp.getChannelValveAt(1).valve.buffer).to.eql([2])
    }

    method(mp)
    for (const smp of splitter.allPipes) {
      expect(smp.getChannelValveAt(0).valve.buffer).to.eql(expected[0])
      expect(smp.getChannelValveAt(1).valve.buffer).to.eql(expected[1])
    }
    await delayPromise(70)
    expect(result).to.eql(expected[2])
  }

  describe('ClearOne at 0 - meaning wipe out the whole Splitter', () => {
    it('clears out the whole Splitter', async () => {
      return testInput(mp => mp.buffersClearOne(0), [
        [],
        [],
        ['on_busy_1', 'on_idle'],
      ])
    })
  })

  describe('ClearOne at 1', () => {
    it('clears out the first valve', async () => {
      return testInput(mp => mp.buffersClearOne(1), [
        [],
        [2],
        ['on_busy_1', 1, 2, 'on_idle'],
      ])
    })
  })

  describe('ClearOne at 2', () => {
    it('clears out the second valve', async () => {
      return testInput(mp => mp.buffersClearOne(2), [
        [4],
        [],
        ['on_busy_1', 3, 4, 'on_idle'],
      ])
    })
  })

  describe('ClearAll', () => {
    it('clears out both valves', async () => {
      return testInput(mp => mp.buffersClearAll(), [
        [],
        [],
        ['on_busy_1', 'on_idle'],
      ])
    })
  })

})

describe('MoonPipe.Buffers with Splitter, 2nd case', () => {

  async function testInput(method, expected) {
    const result = []
    const mp = new MoonPipe()
      .splitBy(1, () => 'wahtever')
      .queueTap(async () => {
        await delayPromise(10)
      })
      .join()
      .queueTap(async () => {
        await delayPromise(20)
      })
      .queueTap(async (value) => {
        result.push(value)
      })
      .onBusyTap(async (value) => {
        result.push('on_busy_' + value)
      })
      .onIdle(async () => {
        result.push('on_idle')
      })

    mp.pump(1)
    mp.pump(2)
    mp.pump(3)
    mp.pump(4)

    await delayPromise(25)
    const splitter = mp.getChannelValveAt(0).valve
    for (const smp of splitter.allPipes) {
      expect(smp.getChannelValveAt(0).valve.buffer).to.eql([4])
    }
    expect(mp.getChannelValveAt(1).valve.buffer).to.eql([2])

    method(mp)
    for (const smp of splitter.allPipes) {
      expect(smp.getChannelValveAt(0).valve.buffer).to.eql(expected[0])
    }
    expect(mp.getChannelValveAt(1).valve.buffer).to.eql(expected[1])
    await delayPromise(70)
    expect(result).to.eql(expected[2])
  }

  describe('ClearOne at 0 - meaning wipe out the whole Splitter', () => {
    it('clears out the whole Splitter', async () => {
      return testInput(mp => mp.buffersClearOne(0), [
        [],
        [2],
        ['on_busy_1', 1, 2, 'on_idle'],
      ])
    })
  })

  describe('ClearOne at 1', () => {
    it('clears out the first valve', async () => {
      return testInput(mp => mp.buffersClearOne(1), [
        [],
        [2],
        ['on_busy_1', 1, 2, 'on_idle'],
      ])
    })
  })

  describe('ClearOne at 2', () => {
    it('clears out the second valve', async () => {
      return testInput(mp => mp.buffersClearOne(2), [
        [4],
        [],
        ['on_busy_1', 3, 4, 'on_idle'],
      ])
    })
  })

  describe('ClearAll', () => {
    it('clears out both valves', async () => {
      return testInput(mp => mp.buffersClearAll(), [
        [],
        [],
        ['on_busy_1', 'on_idle'],
      ])
    })
  })

})
