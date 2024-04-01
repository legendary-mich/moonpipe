export class Splitter {
    constructor(preset: any, classifyFn: any);
    classify: any;
    name: any;
    preset: any;
    onData: (data: any) => void;
    onError: (err: any) => void;
    onReady: () => void;
    poolSize: any;
    mpPool: MoonPipe<any, any>[];
    allPipes: MoonPipe<any, any>[];
    activePipes: {};
    dataBuckets: {};
    clone(): Splitter;
    get hasName(): boolean;
    pipe(valve: any, inputChannel: any, outputChannel: any): this;
    join(): void;
    get isIdle(): boolean;
    push(data: any): void;
    next(): void;
    cleanUp(mp: any): void;
    bufferClear(): void;
    buffersClearOne(valveName: any): void;
    cacheClear(): void;
    cacheClearOne(valveName: any, ...values: any[]): void;
    cacheClearByResult(valveName: any, predicateFunc: any): void;
    cacheUpdateByResult(valveName: any, transformFunc: any): void;
}
import { MoonPipe } from "./MoonPipe.js";
export declare namespace SplitterPresets {
    namespace basic {
        let name: any;
        let poolSize: number;
    }
}
