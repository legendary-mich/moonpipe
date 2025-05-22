export class RichPromise {
    constructor(preset: any, promiseFactory: any);
    promiseFactory: any;
    timeoutMs: any;
    repeatPredicate: any;
    repeatBackoff: any;
    isCanceled: boolean;
    activeTimeout: number;
    publicContext: PromiseContext;
    attemptsMade: number;
    cancel(): void;
    getTimeoutPromise(): Promise<any>;
    runOnce(value: any): Promise<any>;
    shouldRepeat(err: any): any;
    repeatDelay(): Promise<void>;
    run(value: any): Promise<any>;
}
export class TimeoutError extends Error {
    constructor();
}
export class PromiseContext {
    _onCancel: () => void;
    _hasOnCancelAlreadyRun: boolean;
    /**
     * @param {function(): void} callback
     * @returns void
     */
    set onCancel(callback: () => void);
    /**
     * @returns {function(): void}
     */
    get onCancel(): () => void;
    /**
     * For INTERNAL use only.
     */
    _runOnCancel(): void;
}
