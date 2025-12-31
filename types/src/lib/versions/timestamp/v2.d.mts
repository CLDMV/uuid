/**
 * Create a Timestamp Variant v2 UUID (milliseconds precision)
 * @param {number|Date|null} timestamp - Timestamp value (optional, defaults to current time in milliseconds)
 * @param {Buffer|null} entropy - Optional entropy for bits 79-127
 * @returns {Buffer} 16-byte UUID buffer
 */
export function v2(timestamp?: number | Date | null, entropy?: Buffer | null): Buffer;
/**
 * Parse timestamp from a Timestamp v2 UUID buffer
 * @param {Buffer} buffer - UUID buffer
 * @returns {number} Timestamp value in milliseconds
 */
export function parseTimestamp(buffer: Buffer): number;
/**
 * Create a Timestamp Variant v2 UUID (milliseconds precision)
 * @param {number|Date|null} timestamp - Timestamp value (optional, defaults to current time in milliseconds)
 * @param {Buffer|null} entropy - Optional entropy for bits 79-127
 * @returns {Buffer} 16-byte UUID buffer
 */
export function tb(timestamp?: number | Date | null, entropy?: Buffer | null): Buffer;
//# sourceMappingURL=v2.d.mts.map