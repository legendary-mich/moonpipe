/**
 * @template D_IN, D_OUT
 */
export class MoonPipe<D_IN, D_OUT> {
    channelValves: any[];
    valvesByName: {};
    activeChannel: string;
    history: any[];
    hooks: {
        onBusyTap: any;
        onBusy: any;
        onIdle: any;
        busyIdleLatch: Latch;
        onData: any;
        onError: any;
    };
    splittersOnTheStack: number;
    gatewaySplitter: any;
    /**
     * @param {string} [channelType]
     * @returns {boolean}
     */
    isIdle(channelType?: string): boolean;
    /**
     * @param {BaseValve|Splitter} valve
     * @param {string} [inputChannel]
     * @param {string} [outputChannel]
     * @returns {MoonPipe<D_IN, *>}
     */
    pipe(valve: {
        new (preset: any): {
            name: any;
            buffer: any[];
            bufferType: any;
            maxBufferSize: any;
            numberOfReservedSlots: number;
            overflowAction: any;
            outputChannel: any;
            preset: any;
            onData: (data: any) => void;
            onError: (err: any) => void;
            onReady: () => void;
            clone(): any;
            readonly hasName: boolean;
            readonly numberOfFreeSlots: number;
            readonly isIdle: boolean;
            pluck(): any;
            push(data: any): void;
            next(): void;
            emitOut(val: any): void;
            emitErr(err: any): void;
            emitReady(): void;
            bufferClear(): void;
            cacheClear(): void;
            cacheClearAt(...values: any[]): void;
        };
    } | any, inputChannel?: string, outputChannel?: string): MoonPipe<D_IN, any>;
    /**
     * For INTERNAL use only.
     * @private
     */
    private _pump;
    /**
     * @param {D_IN} data
     * @returns {void}
     */
    pump(data: D_IN): void;
    /**
     * @returns {void}
     */
    rePumpLast(): void;
    /**
     * For INTERNAL use only.
     * @private
     */
    private cleanUp;
    /**
     * For INTERNAL use only.
     * @private
     */
    private nextOrEnd;
    /**
     * For INTERNAL use only.
     * @private
     */
    private next;
    /**
     * @param {number} valveIndex
     * @returns {{inputChannel: string, outputChannel: string, valve: BaseValve|Splitter}}
     */
    getChannelValveAt(valveIndex: number): {
        inputChannel: string;
        outputChannel: string;
        valve: {
            new (preset: any): {
                name: any;
                buffer: any[];
                bufferType: any;
                maxBufferSize: any;
                numberOfReservedSlots: number;
                overflowAction: any;
                outputChannel: any;
                preset: any;
                onData: (data: any) => void;
                onError: (err: any) => void;
                onReady: () => void;
                clone(): any;
                readonly hasName: boolean;
                readonly numberOfFreeSlots: number;
                readonly isIdle: boolean;
                pluck(): any;
                push(data: any): void;
                next(): void;
                emitOut(val: any): void;
                emitErr(err: any): void;
                emitReady(): void;
                bufferClear(): void;
                cacheClear(): void;
                cacheClearAt(...values: any[]): void;
            };
        } | any;
    };
    /**
     * Returns either a valve, or a top-level splitter holding the valve.
     * @param {string} valveName
     * @returns {BaseValve|Splitter}
     */
    getTopLevelValveFor(valveName: string): {
        new (preset: any): {
            name: any;
            buffer: any[];
            bufferType: any;
            maxBufferSize: any;
            numberOfReservedSlots: number;
            overflowAction: any;
            outputChannel: any;
            preset: any;
            onData: (data: any) => void;
            onError: (err: any) => void;
            onReady: () => void;
            clone(): any;
            readonly hasName: boolean;
            readonly numberOfFreeSlots: number;
            readonly isIdle: boolean;
            pluck(): any;
            push(data: any): void;
            next(): void;
            emitOut(val: any): void;
            emitErr(err: any): void;
            emitReady(): void;
            bufferClear(): void;
            cacheClear(): void;
            cacheClearAt(...values: any[]): void;
        };
    } | any;
    /**
     * @returns {void}
     */
    buffersClearAll(): void;
    /**
     * @param {string} valveName
     * @returns {void}
     */
    buffersClearOne(valveName: string): void;
    /**
     * @returns {void}
     */
    cacheClearAll(): void;
    /**
     * @param {string} valveName
     * @param {...*} values
     * @returns {void}
     */
    cacheClearOne(valveName: string, ...values: any[]): void;
    /**
     * @param {string} valveName
     * @param {function(*, *): boolean} predicateFunc
     * @returns {void}
     */
    cacheClearByResult(valveName: string, predicateFunc: (arg0: any, arg1: any) => boolean): void;
    /**
     * @param {string} valveName
     * @param {function(*, *): *} transformFunc
     * @returns {void}
     */
    cacheUpdateByResult(valveName: string, transformFunc: (arg0: any, arg1: any) => any): void;
    /**
     * @deprecated
     * @param {function(D_IN): void} callback
     * @returns {MoonPipe<D_IN, D_OUT>}
     */
    onBusyTap(callback: (arg0: D_IN) => void): MoonPipe<D_IN, D_OUT>;
    /**
     * @param {function(): void} callback
     * @returns {MoonPipe<D_IN, D_OUT>}
     */
    onBusy(callback: () => void): MoonPipe<D_IN, D_OUT>;
    /**
     * @param {function(): void} callback
     * @returns {MoonPipe<D_IN, D_OUT>}
     */
    onIdle(callback: () => void): MoonPipe<D_IN, D_OUT>;
    /**
     * For INTERNAL use only.
     * Users should use the queueTap valve instead.
     */
    onData(callback: any): this;
    /**
     * For INTERNAL use only.
     * Users should use the queueError valve instead.
     */
    onError(callback: any): this;
    /**
     * @typedef {import("./RichPromise.js").PromiseContext} PromiseContext
     */
    /**
     * @template P_OUT
     * @callback PromiseFactory
     * @param {D_OUT} value
     * @param {PromiseContext} context
     * @returns {Promise<P_OUT>}
     */
    /**
     * @template P_OUT
     * @callback ErrorPromiseFactory
     * @param {Error} value
     * @param {PromiseContext} context
     * @returns {Promise<P_OUT>}
     */
    /**
     * @template P_OUT
     * @callback SlicePromiseFactory
     * @param {Array<D_OUT>} value
     * @param {PromiseContext} context
     * @returns {Promise<P_OUT>}
     */
    /**
     * @typedef {Object} PromisePreset
     * @property {string} [name]
     * @property {number} [maxBufferSize]
     * @property {string} [bufferType]
     * @property {string} [overflowAction]
     * @property {string} [resolveType]
     * @property {boolean} [cancelOnPump]
     * @property {number} [timeoutMs]
     * @property {number} [poolSize]
     * @property {boolean} [cache]
     * @property {function(D_OUT): *} [hashFunction]
     * @property {function(number, Error): boolean} [repeatPredicate]
     * @property {function(): {nextDelayMs: function(): number}} [repeatBackoffFactory]
     */
    /**
     * @typedef {Object} TimePreset
     * @property {string} [name]
     * @property {number} [maxBufferSize]
     * @property {string} [bufferType]
     * @property {string} [overflowAction]
     * @property {string} [resolveType]
     * @property {boolean} [cancelOnPump]
     */
    /**
     * @typedef {Object} SynchronousPreset
     * @property {string} [name]
     * @property {number} [maxBufferSize]
     * @property {string} [bufferType]
     * @property {string} [overflowAction]
     */
    /**
     * @typedef {Object} SplitterPreset
     * @property {string} [name]
     * @property {number} [poolSize]
     */
    /**
     * @template P_OUT
     * @param {PromiseFactory<P_OUT>} promiseFactory
     * @param {PromisePreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT>}
     */
    queueTap<P_OUT>(promiseFactory: (value: D_OUT, context: import("./RichPromise.js").PromiseContext) => Promise<P_OUT>, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
        timeoutMs?: number;
        poolSize?: number;
        cache?: boolean;
        hashFunction?: (arg0: D_OUT) => any;
        repeatPredicate?: (arg0: number, arg1: Error) => boolean;
        repeatBackoffFactory?: () => {
            nextDelayMs: () => number;
        };
    }): MoonPipe<D_IN, D_OUT>;
    /**
     * @template P_OUT
     * @param {PromiseFactory<P_OUT>} promiseFactory
     * @param {PromisePreset} [options]
     * @returns {MoonPipe<D_IN, P_OUT>}
     */
    queueMap<P_OUT_1>(promiseFactory: (value: D_OUT, context: import("./RichPromise.js").PromiseContext) => Promise<P_OUT_1>, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
        timeoutMs?: number;
        poolSize?: number;
        cache?: boolean;
        hashFunction?: (arg0: D_OUT) => any;
        repeatPredicate?: (arg0: number, arg1: Error) => boolean;
        repeatBackoffFactory?: () => {
            nextDelayMs: () => number;
        };
    }): MoonPipe<D_IN, P_OUT_1>;
    /**
     * @template P_OUT
     * @param {ErrorPromiseFactory<P_OUT>} promiseFactory
     * @param {PromisePreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT|P_OUT>}
     */
    queueError<P_OUT_2>(promiseFactory: (value: Error, context: import("./RichPromise.js").PromiseContext) => Promise<P_OUT_2>, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
        timeoutMs?: number;
        poolSize?: number;
        cache?: boolean;
        hashFunction?: (arg0: D_OUT) => any;
        repeatPredicate?: (arg0: number, arg1: Error) => boolean;
        repeatBackoffFactory?: () => {
            nextDelayMs: () => number;
        };
    }): MoonPipe<D_IN, D_OUT | P_OUT_2>;
    /**
     * @param {number} intervalMs
     * @param {TimePreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT>}
     */
    queueEager(intervalMs: number, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
    }): MoonPipe<D_IN, D_OUT>;
    /**
     * @param {number} intervalMs
     * @param {TimePreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT>}
     */
    queueLazy(intervalMs: number, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
    }): MoonPipe<D_IN, D_OUT>;
    /**
     * @template P_OUT
     * @param {PromiseFactory<P_OUT>} promiseFactory
     * @param {PromisePreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT>}
     */
    cancelTap<P_OUT_3>(promiseFactory: (value: D_OUT, context: import("./RichPromise.js").PromiseContext) => Promise<P_OUT_3>, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
        timeoutMs?: number;
        poolSize?: number;
        cache?: boolean;
        hashFunction?: (arg0: D_OUT) => any;
        repeatPredicate?: (arg0: number, arg1: Error) => boolean;
        repeatBackoffFactory?: () => {
            nextDelayMs: () => number;
        };
    }): MoonPipe<D_IN, D_OUT>;
    /**
     * @template P_OUT
     * @param {PromiseFactory<P_OUT>} promiseFactory
     * @param {PromisePreset} [options]
     * @returns {MoonPipe<D_IN, P_OUT>}
     */
    cancelMap<P_OUT_4>(promiseFactory: (value: D_OUT, context: import("./RichPromise.js").PromiseContext) => Promise<P_OUT_4>, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
        timeoutMs?: number;
        poolSize?: number;
        cache?: boolean;
        hashFunction?: (arg0: D_OUT) => any;
        repeatPredicate?: (arg0: number, arg1: Error) => boolean;
        repeatBackoffFactory?: () => {
            nextDelayMs: () => number;
        };
    }): MoonPipe<D_IN, P_OUT_4>;
    /**
     * @template P_OUT
     * @param {ErrorPromiseFactory<P_OUT>} promiseFactory
     * @param {PromisePreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT|P_OUT>}
     */
    cancelError<P_OUT_5>(promiseFactory: (value: Error, context: import("./RichPromise.js").PromiseContext) => Promise<P_OUT_5>, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
        timeoutMs?: number;
        poolSize?: number;
        cache?: boolean;
        hashFunction?: (arg0: D_OUT) => any;
        repeatPredicate?: (arg0: number, arg1: Error) => boolean;
        repeatBackoffFactory?: () => {
            nextDelayMs: () => number;
        };
    }): MoonPipe<D_IN, D_OUT | P_OUT_5>;
    /**
     * @param {number} intervalMs
     * @param {TimePreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT>}
     */
    cancelEager(intervalMs: number, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
    }): MoonPipe<D_IN, D_OUT>;
    /**
     * @param {number} intervalMs
     * @param {TimePreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT>}
     */
    cancelLazy(intervalMs: number, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
    }): MoonPipe<D_IN, D_OUT>;
    /**
     * @template P_OUT
     * @param {PromiseFactory<P_OUT>} promiseFactory
     * @param {PromisePreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT>}
     */
    throttleTap<P_OUT_6>(promiseFactory: (value: D_OUT, context: import("./RichPromise.js").PromiseContext) => Promise<P_OUT_6>, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
        timeoutMs?: number;
        poolSize?: number;
        cache?: boolean;
        hashFunction?: (arg0: D_OUT) => any;
        repeatPredicate?: (arg0: number, arg1: Error) => boolean;
        repeatBackoffFactory?: () => {
            nextDelayMs: () => number;
        };
    }): MoonPipe<D_IN, D_OUT>;
    /**
     * @template P_OUT
     * @param {PromiseFactory<P_OUT>} promiseFactory
     * @param {PromisePreset} [options]
     * @returns {MoonPipe<D_IN, P_OUT>}
     */
    throttleMap<P_OUT_7>(promiseFactory: (value: D_OUT, context: import("./RichPromise.js").PromiseContext) => Promise<P_OUT_7>, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
        timeoutMs?: number;
        poolSize?: number;
        cache?: boolean;
        hashFunction?: (arg0: D_OUT) => any;
        repeatPredicate?: (arg0: number, arg1: Error) => boolean;
        repeatBackoffFactory?: () => {
            nextDelayMs: () => number;
        };
    }): MoonPipe<D_IN, P_OUT_7>;
    /**
     * @template P_OUT
     * @param {ErrorPromiseFactory<P_OUT>} promiseFactory
     * @param {PromisePreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT|P_OUT>}
     */
    throttleError<P_OUT_8>(promiseFactory: (value: Error, context: import("./RichPromise.js").PromiseContext) => Promise<P_OUT_8>, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
        timeoutMs?: number;
        poolSize?: number;
        cache?: boolean;
        hashFunction?: (arg0: D_OUT) => any;
        repeatPredicate?: (arg0: number, arg1: Error) => boolean;
        repeatBackoffFactory?: () => {
            nextDelayMs: () => number;
        };
    }): MoonPipe<D_IN, D_OUT | P_OUT_8>;
    /**
     * @param {number} intervalMs
     * @param {TimePreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT>}
     */
    throttleEager(intervalMs: number, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
    }): MoonPipe<D_IN, D_OUT>;
    /**
     * @param {number} intervalMs
     * @param {TimePreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT>}
     */
    throttleLazy(intervalMs: number, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
    }): MoonPipe<D_IN, D_OUT>;
    /**
     * @template P_OUT
     * @param {PromiseFactory<P_OUT>} promiseFactory
     * @param {PromisePreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT>}
     */
    skipTap<P_OUT_9>(promiseFactory: (value: D_OUT, context: import("./RichPromise.js").PromiseContext) => Promise<P_OUT_9>, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
        timeoutMs?: number;
        poolSize?: number;
        cache?: boolean;
        hashFunction?: (arg0: D_OUT) => any;
        repeatPredicate?: (arg0: number, arg1: Error) => boolean;
        repeatBackoffFactory?: () => {
            nextDelayMs: () => number;
        };
    }): MoonPipe<D_IN, D_OUT>;
    /**
     * @template P_OUT
     * @param {PromiseFactory<P_OUT>} promiseFactory
     * @param {PromisePreset} [options]
     * @returns {MoonPipe<D_IN, P_OUT>}
     */
    skipMap<P_OUT_10>(promiseFactory: (value: D_OUT, context: import("./RichPromise.js").PromiseContext) => Promise<P_OUT_10>, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
        timeoutMs?: number;
        poolSize?: number;
        cache?: boolean;
        hashFunction?: (arg0: D_OUT) => any;
        repeatPredicate?: (arg0: number, arg1: Error) => boolean;
        repeatBackoffFactory?: () => {
            nextDelayMs: () => number;
        };
    }): MoonPipe<D_IN, P_OUT_10>;
    /**
     * @template P_OUT
     * @param {ErrorPromiseFactory<P_OUT>} promiseFactory
     * @param {PromisePreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT|P_OUT>}
     */
    skipError<P_OUT_11>(promiseFactory: (value: Error, context: import("./RichPromise.js").PromiseContext) => Promise<P_OUT_11>, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
        timeoutMs?: number;
        poolSize?: number;
        cache?: boolean;
        hashFunction?: (arg0: D_OUT) => any;
        repeatPredicate?: (arg0: number, arg1: Error) => boolean;
        repeatBackoffFactory?: () => {
            nextDelayMs: () => number;
        };
    }): MoonPipe<D_IN, D_OUT | P_OUT_11>;
    /**
     * @param {number} intervalMs
     * @param {TimePreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT>}
     */
    skipEager(intervalMs: number, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
    }): MoonPipe<D_IN, D_OUT>;
    /**
     * @param {number} intervalMs
     * @param {TimePreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT>}
     */
    skipLazy(intervalMs: number, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
    }): MoonPipe<D_IN, D_OUT>;
    /**
     * @template P_OUT
     * @param {number} chunkSize
     * @param {SlicePromiseFactory<P_OUT>} promiseFactory
     * @param {PromisePreset} [options]
     * @returns {MoonPipe<D_IN, Array<D_OUT>>}
     */
    sliceTap<P_OUT_12>(chunkSize: number, promiseFactory: (value: Array<D_OUT>, context: import("./RichPromise.js").PromiseContext) => Promise<P_OUT_12>, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
        timeoutMs?: number;
        poolSize?: number;
        cache?: boolean;
        hashFunction?: (arg0: D_OUT) => any;
        repeatPredicate?: (arg0: number, arg1: Error) => boolean;
        repeatBackoffFactory?: () => {
            nextDelayMs: () => number;
        };
    }): MoonPipe<D_IN, Array<D_OUT>>;
    /**
     * @template P_OUT
     * @param {number} chunkSize
     * @param {SlicePromiseFactory<P_OUT>} promiseFactory
     * @param {PromisePreset} [options]
     * @returns {MoonPipe<D_IN, P_OUT>}
     */
    sliceMap<P_OUT_13>(chunkSize: number, promiseFactory: (value: Array<D_OUT>, context: import("./RichPromise.js").PromiseContext) => Promise<P_OUT_13>, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
        timeoutMs?: number;
        poolSize?: number;
        cache?: boolean;
        hashFunction?: (arg0: D_OUT) => any;
        repeatPredicate?: (arg0: number, arg1: Error) => boolean;
        repeatBackoffFactory?: () => {
            nextDelayMs: () => number;
        };
    }): MoonPipe<D_IN, P_OUT_13>;
    /**
     * @param {number} chunkSize
     * @param {number} intervalMs
     * @param {TimePreset} [options]
     * @returns {MoonPipe<D_IN, Array<D_OUT>>}
     */
    sliceEager(chunkSize: number, intervalMs: number, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
    }): MoonPipe<D_IN, Array<D_OUT>>;
    /**
     * @param {number} chunkSize
     * @param {number} intervalMs
     * @param {TimePreset} [options]
     * @returns {MoonPipe<D_IN, Array<D_OUT>>}
     */
    sliceLazy(chunkSize: number, intervalMs: number, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
    }): MoonPipe<D_IN, Array<D_OUT>>;
    /**
     * @template P_OUT
     * @param {number} poolSize
     * @param {PromiseFactory<P_OUT>} promiseFactory
     * @param {PromisePreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT>}
     */
    poolTap<P_OUT_14>(poolSize: number, promiseFactory: (value: D_OUT, context: import("./RichPromise.js").PromiseContext) => Promise<P_OUT_14>, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
        timeoutMs?: number;
        poolSize?: number;
        cache?: boolean;
        hashFunction?: (arg0: D_OUT) => any;
        repeatPredicate?: (arg0: number, arg1: Error) => boolean;
        repeatBackoffFactory?: () => {
            nextDelayMs: () => number;
        };
    }): MoonPipe<D_IN, D_OUT>;
    /**
     * @template P_OUT
     * @param {number} poolSize
     * @param {PromiseFactory<P_OUT>} promiseFactory
     * @param {PromisePreset} [options]
     * @returns {MoonPipe<D_IN, P_OUT>}
     */
    poolMap<P_OUT_15>(poolSize: number, promiseFactory: (value: D_OUT, context: import("./RichPromise.js").PromiseContext) => Promise<P_OUT_15>, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
        resolveType?: string;
        cancelOnPump?: boolean;
        timeoutMs?: number;
        poolSize?: number;
        cache?: boolean;
        hashFunction?: (arg0: D_OUT) => any;
        repeatPredicate?: (arg0: number, arg1: Error) => boolean;
        repeatBackoffFactory?: () => {
            nextDelayMs: () => number;
        };
    }): MoonPipe<D_IN, P_OUT_15>;
    /**
     * @param {SynchronousPreset} [options]
     * @returns {MoonPipe<D_IN, *>}
     */
    flatten(options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
    }): MoonPipe<D_IN, any>;
    /**
     * @template T_OUT
     * @param {function(D_OUT): T_OUT} transformFunc
     * @param {SynchronousPreset} [options]
     * @returns {MoonPipe<D_IN, T_OUT>}
     */
    map<T_OUT>(transformFunc: (arg0: D_OUT) => T_OUT, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
    }): MoonPipe<D_IN, T_OUT>;
    /**
     * @param {function(D_OUT): boolean} predicateFunc
     * @param {SynchronousPreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT>}
     */
    filter(predicateFunc: (arg0: D_OUT) => boolean, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
    }): MoonPipe<D_IN, D_OUT>;
    /**
     * @template {Error} E_IN
     * @param {function(E_IN): boolean} predicateFunc
     * @param {SynchronousPreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT|E_IN>}
     */
    filterError<E_IN extends Error>(predicateFunc: (arg0: E_IN) => boolean, options?: {
        name?: string;
        maxBufferSize?: number;
        bufferType?: string;
        overflowAction?: string;
    }): MoonPipe<D_IN, D_OUT | E_IN>;
    /**
     * @param {number} poolSize
     * @param {function(D_OUT): *} classifyFn
     * @param {SplitterPreset} [options]
     * @returns {MoonPipe<D_IN, D_OUT>}
     */
    splitBy(poolSize: number, classifyFn: (arg0: D_OUT) => any, options?: {
        name?: string;
        poolSize?: number;
    }): MoonPipe<D_IN, D_OUT>;
    /**
     * @returns {MoonPipe<D_IN, D_OUT>}
     */
    join(): MoonPipe<D_IN, D_OUT>;
    /**
     * @param {number} valveIndex
     * @returns {void}
     */
    validateChannelValveIdnex(valveIndex: number): void;
    /**
     * @param {string} hookName
     * @param {function} callback
     * @returns {void}
     */
    validateHookCallback(hookName: string, callback: Function): void;
}
import { Latch } from "./Latch.js";
