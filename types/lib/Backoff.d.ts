export class ConstantBackoff {
    /**
     * @param {number} delay
     */
    constructor(delay: number);
    delay: number;
    /**
     * @returns {number}
     */
    nextDelayMs(): number;
}
export class LinearBackoff {
    /**
     * @param {number} baseDelay
     */
    constructor(baseDelay: number);
    baseDelay: number;
    multiplier: number;
    /**
     * @returns {number}
     */
    nextDelayMs(): number;
}
