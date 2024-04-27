export class Cache {
    constructor(preset: any);
    enabled: any;
    hashFunction: any;
    results: Map<any, any>;
    cleanupActions: any[];
    has(value: any): boolean;
    get(value: any): any;
    set(value: any, result: any): void;
    shouldCleanUp(): boolean;
    cleanUp(): void;
    clearAt(...values: any[]): void;
    clear(): void;
    clearByResult(predicateFunc: any): void;
    updateByResult(transformFunc: any): void;
}
