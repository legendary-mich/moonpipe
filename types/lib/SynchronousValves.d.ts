declare const FlattenValve_base: {
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
export class FlattenValve extends FlattenValve_base {
}
declare const MapValve_base: {
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
export class MapValve extends MapValve_base {
    constructor(preset: any, transformFunc: any);
    transformFunc: any;
    clone(): MapValve;
}
declare const FilterValve_base: {
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
export class FilterValve extends FilterValve_base {
    constructor(preset: any, predicateFunc: any);
    predicateFunc: any;
    clone(): FilterValve;
}
declare namespace dataOut {
    export let name: any;
    export { MAX_ARRAY_SIZE as maxBufferSize };
    export let bufferType: string;
    export let overflowAction: string;
    export let outputChannel: string;
}
declare const errorOut: {
    name: any;
    maxBufferSize: number;
    bufferType: string;
    overflowAction: string;
    outputChannel: string;
} & {
    outputChannel: string;
};
import { MAX_ARRAY_SIZE } from "./BaseValve.js";
export declare namespace SynchronousPresets {
    export { dataOut };
    export { errorOut };
}
export {};
