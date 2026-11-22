/**
 * Create a Timestamp Variant v1 UUID (seconds precision)
 * @param {number|bigint|string|Date|null} timestamp - Timestamp value (optional, defaults to current time in seconds)
 * @param {Buffer|null} entropy - Optional entropy for bits 79-127
 * @returns {Buffer} 16-byte UUID buffer
 */
export function v1(timestamp?: number | bigint | string | Date | null, entropy?: Buffer | null): Buffer;
/**
 * Parse timestamp from a Timestamp v1 UUID buffer
 * @param {Buffer} buffer - UUID buffer
 * @returns {number|bigint} Timestamp value in seconds: a number while it is a safe integer, an exact bigint past ±(2^53 - 1)
 */
export function parseTimestamp(buffer: Buffer): number | bigint;
//# sourceMappingURL=v1.d.mts.map