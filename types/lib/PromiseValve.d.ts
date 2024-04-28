declare const PromiseValve_base: {
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
export class PromiseValve extends PromiseValve_base {
    constructor(preset: any, promiseFactory: any);
    cancelOnPump: any;
    resolveType: any;
    cache: Cache;
    promiseFactory: any;
    promisePool: any[];
    poolSize: any;
    clone(): PromiseValve;
    cacheClearByResult(predicateFunc: any): void;
    cacheUpdateByResult(transformFunc: any): void;
    cachePopulate(value: any, result: any): void;
    poolAdd(promise: any): void;
    poolRemove(promise: any): void;
    poolClear(): void;
    isReady(): boolean;
    spinUpAPromise(): Promise<void>;
}
export namespace PROMISE_RESOLVE_TYPE {
    let TAP: string;
    let MAP: string;
}
import { TimeoutError } from "./RichPromise.js";
declare namespace queueMap {
    export let name: any;
    export { MAX_ARRAY_SIZE as maxBufferSize };
    export let bufferType: string;
    export let overflowAction: string;
    import resolveType = PROMISE_RESOLVE_TYPE.MAP;
    export { resolveType };
    export let cancelOnPump: boolean;
    export let timeoutMs: number;
    export let poolSize: number;
    export let cache: boolean;
    export function hashFunction(value: any): any;
    export function repeatPredicate(): boolean;
    export function repeatBackoffFactory(): ConstantBackoff;
}
declare namespace cancelMap {
    let name_1: any;
    export { name_1 as name };
    export let maxBufferSize: number;
    let bufferType_1: string;
    export { bufferType_1 as bufferType };
    let overflowAction_1: string;
    export { overflowAction_1 as overflowAction };
    import resolveType_1 = PROMISE_RESOLVE_TYPE.MAP;
    export { resolveType_1 as resolveType };
    let cancelOnPump_1: boolean;
    export { cancelOnPump_1 as cancelOnPump };
    let timeoutMs_1: number;
    export { timeoutMs_1 as timeoutMs };
    let poolSize_1: number;
    export { poolSize_1 as poolSize };
    let cache_1: boolean;
    export { cache_1 as cache };
    export function hashFunction_1(value: any): any;
    export { hashFunction_1 as hashFunction };
    export function repeatPredicate_1(): boolean;
    export { repeatPredicate_1 as repeatPredicate };
    export function repeatBackoffFactory_1(): ConstantBackoff;
    export { repeatBackoffFactory_1 as repeatBackoffFactory };
}
declare namespace throttleMap {
    let name_2: any;
    export { name_2 as name };
    let maxBufferSize_1: number;
    export { maxBufferSize_1 as maxBufferSize };
    let bufferType_2: string;
    export { bufferType_2 as bufferType };
    let overflowAction_2: string;
    export { overflowAction_2 as overflowAction };
    import resolveType_2 = PROMISE_RESOLVE_TYPE.MAP;
    export { resolveType_2 as resolveType };
    let cancelOnPump_2: boolean;
    export { cancelOnPump_2 as cancelOnPump };
    let timeoutMs_2: number;
    export { timeoutMs_2 as timeoutMs };
    let poolSize_2: number;
    export { poolSize_2 as poolSize };
    let cache_2: boolean;
    export { cache_2 as cache };
    export function hashFunction_2(value: any): any;
    export { hashFunction_2 as hashFunction };
    export function repeatPredicate_2(): boolean;
    export { repeatPredicate_2 as repeatPredicate };
    export function repeatBackoffFactory_2(): ConstantBackoff;
    export { repeatBackoffFactory_2 as repeatBackoffFactory };
}
declare namespace skipMap {
    let name_3: any;
    export { name_3 as name };
    let maxBufferSize_2: number;
    export { maxBufferSize_2 as maxBufferSize };
    let bufferType_3: string;
    export { bufferType_3 as bufferType };
    let overflowAction_3: string;
    export { overflowAction_3 as overflowAction };
    import resolveType_3 = PROMISE_RESOLVE_TYPE.MAP;
    export { resolveType_3 as resolveType };
    let cancelOnPump_3: boolean;
    export { cancelOnPump_3 as cancelOnPump };
    let timeoutMs_3: number;
    export { timeoutMs_3 as timeoutMs };
    let poolSize_3: number;
    export { poolSize_3 as poolSize };
    let cache_3: boolean;
    export { cache_3 as cache };
    export function hashFunction_3(value: any): any;
    export { hashFunction_3 as hashFunction };
    export function repeatPredicate_3(): boolean;
    export { repeatPredicate_3 as repeatPredicate };
    export function repeatBackoffFactory_3(): ConstantBackoff;
    export { repeatBackoffFactory_3 as repeatBackoffFactory };
}
declare namespace sliceMap {
    let name_4: any;
    export { name_4 as name };
    let bufferType_4: string;
    export { bufferType_4 as bufferType };
    let overflowAction_4: string;
    export { overflowAction_4 as overflowAction };
    import resolveType_4 = PROMISE_RESOLVE_TYPE.MAP;
    export { resolveType_4 as resolveType };
    let cancelOnPump_4: boolean;
    export { cancelOnPump_4 as cancelOnPump };
    let timeoutMs_4: number;
    export { timeoutMs_4 as timeoutMs };
    let poolSize_4: number;
    export { poolSize_4 as poolSize };
    let cache_4: boolean;
    export { cache_4 as cache };
    export function hashFunction_4(value: any): any;
    export { hashFunction_4 as hashFunction };
    export function repeatPredicate_4(): boolean;
    export { repeatPredicate_4 as repeatPredicate };
    export function repeatBackoffFactory_4(): ConstantBackoff;
    export { repeatBackoffFactory_4 as repeatBackoffFactory };
}
import { Cache } from "./Cache.js";
import { MAX_ARRAY_SIZE } from "./BaseValve.js";
import { ConstantBackoff } from "./Backoff.js";
export declare namespace PromisePresets {
    export { queueMap };
    export { cancelMap };
    export { throttleMap };
    export { skipMap };
    export { sliceMap };
    export let queueTap: any;
    export let cancelTap: any;
    export let throttleTap: any;
    export let skipTap: any;
    export let sliceTap: any;
}
export { TimeoutError };
