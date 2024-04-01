declare const TimeValve_base: {
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
};
export class TimeValve extends TimeValve_base {
    constructor(preset: any, intervalMs: any);
    cancelOnPump: any;
    resolveType: any;
    intervalMs: any;
    clone(): TimeValve;
    set activeTimeout(value: any);
    get activeTimeout(): any;
    _activeTimeout: any;
}
export namespace TIME_RESOLVE_TYPE {
    let EAGER: string;
    let LAZY: string;
}
declare namespace queueLazy {
    export let name: any;
    export { MAX_ARRAY_SIZE as maxBufferSize };
    export let bufferType: string;
    export let overflowAction: string;
    import resolveType = TIME_RESOLVE_TYPE.LAZY;
    export { resolveType };
    export let cancelOnPump: boolean;
}
declare namespace cancelLazy {
    let name_1: any;
    export { name_1 as name };
    export let maxBufferSize: number;
    let bufferType_1: string;
    export { bufferType_1 as bufferType };
    let overflowAction_1: string;
    export { overflowAction_1 as overflowAction };
    import resolveType_1 = TIME_RESOLVE_TYPE.LAZY;
    export { resolveType_1 as resolveType };
    let cancelOnPump_1: boolean;
    export { cancelOnPump_1 as cancelOnPump };
}
declare namespace throttleLazy {
    let name_2: any;
    export { name_2 as name };
    let maxBufferSize_1: number;
    export { maxBufferSize_1 as maxBufferSize };
    let bufferType_2: string;
    export { bufferType_2 as bufferType };
    let overflowAction_2: string;
    export { overflowAction_2 as overflowAction };
    import resolveType_2 = TIME_RESOLVE_TYPE.LAZY;
    export { resolveType_2 as resolveType };
    let cancelOnPump_2: boolean;
    export { cancelOnPump_2 as cancelOnPump };
}
declare namespace skipLazy {
    let name_3: any;
    export { name_3 as name };
    let maxBufferSize_2: number;
    export { maxBufferSize_2 as maxBufferSize };
    let bufferType_3: string;
    export { bufferType_3 as bufferType };
    let overflowAction_3: string;
    export { overflowAction_3 as overflowAction };
    import resolveType_3 = TIME_RESOLVE_TYPE.LAZY;
    export { resolveType_3 as resolveType };
    let cancelOnPump_3: boolean;
    export { cancelOnPump_3 as cancelOnPump };
}
declare namespace sliceLazy {
    let name_4: any;
    export { name_4 as name };
    let bufferType_4: string;
    export { bufferType_4 as bufferType };
    let overflowAction_4: string;
    export { overflowAction_4 as overflowAction };
    import resolveType_4 = TIME_RESOLVE_TYPE.LAZY;
    export { resolveType_4 as resolveType };
    let cancelOnPump_4: boolean;
    export { cancelOnPump_4 as cancelOnPump };
}
import { MAX_ARRAY_SIZE } from "./BaseValve.js";
export declare namespace TimePresets {
    export { queueLazy };
    export { cancelLazy };
    export { throttleLazy };
    export { skipLazy };
    export { sliceLazy };
    export let queueEager: any;
    export let cancelEager: any;
    export let throttleEager: any;
    export let skipEager: any;
    export let sliceEager: any;
}
export {};
