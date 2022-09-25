# Changelog

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
