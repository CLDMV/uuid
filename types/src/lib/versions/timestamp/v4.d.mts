/**
 * Create a Timestamp Variant v4 UUID (milliseconds precision)
 * @param {number|Date|null} timestamp - Timestamp value (optional, defaults to current time in milliseconds)
 * @param {Buffer|null} entropy - Optional entropy for bits 79-127
 * @returns {Buffer} 16-byte UUID buffer
 */
export function v4(timestamp?: number | Date | null, entropy?: Buffer | null): Buffer;
/**
 * Parse timestamp from a Timestamp v4 UUID buffer
 * @param {Buffer} buffer - UUID buffer
 * @returns {number} Timestamp value in milliseconds
 */
export function parseTimestamp(buffer: Buffer): number;
/**
 * Create a Timestamp Variant v4 UUID (milliseconds precision)
 * @param {number|Date|null} timestamp - Timestamp value (optional, defaults to current time in milliseconds)
 * @param {Buffer|null} entropy - Optional entropy for bits 79-127
 * @returns {Buffer} 16-byte UUID buffer
 */
export function tb(timestamp?: number | Date | null, entropy?: Buffer | null): Buffer;
//# sourceMappingURL=v4.d.mts.map