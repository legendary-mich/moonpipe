export class BaseValve {
    constructor(preset: any);
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
    clone(): BaseValve;
    get hasName(): boolean;
    get numberOfFreeSlots(): number;
    get isIdle(): boolean;
    pluck(): any;
    push(data: any): void;
    next(): void;
    emitOut(val: any): void;
    emitErr(err: any): void;
    emitReady(): void;
    bufferClear(): void;
    cacheClear(): void;
    cacheClearAt(...values: any[]): void;
}
export namespace BUFFER_TYPE {
    let QUEUE: string;
}
export namespace CHANNEL_TYPE {
    let DATA: string;
    let ERROR: string;
}
export const MAX_ARRAY_SIZE: number;
export namespace OVERFLOW_ACTION {
    let EMIT_ERROR: string;
    let SHIFT: string;
    let SLICE: string;
    let SKIP: string;
}
export class BufferOverflowError extends Error {
    constructor();
}
declare namespace queue {
    export let name: any;
    export { MAX_ARRAY_SIZE as maxBufferSize };
    import bufferType = BUFFER_TYPE.QUEUE;
    export { bufferType };
    import overflowAction = OVERFLOW_ACTION.EMIT_ERROR;
    export { overflowAction };
}
export declare namespace BasePresets {
    export { queue };
}
export {};
