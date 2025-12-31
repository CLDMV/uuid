/**
 * Create a Timestamp Variant v1 UUID (seconds precision)
 * @param {number|Date|null} timestamp - Timestamp value (optional, defaults to current time in seconds)
 * @param {Buffer|null} entropy - Optional entropy for bits 79-127
 * @returns {Buffer} 16-byte UUID buffer
 */
export function v1(timestamp?: number | Date | null, entropy?: Buffer | null): Buffer;
/**
 * Parse timestamp from a Timestamp v1 UUID buffer
 * @param {Buffer} buffer - UUID buffer
 * @returns {number} Timestamp value in seconds
 */
export function parseTimestamp(buffer: Buffer): number;
/**
 * Create a Timestamp Variant v1 UUID (seconds precision)
 * @param {number|Date|null} timestamp - Timestamp value (optional, defaults to current time in seconds)
 * @param {Buffer|null} entropy - Optional entropy for bits 79-127
 * @returns {Buffer} 16-byte UUID buffer
 */
export function ta(timestamp?: number | Date | null, entropy?: Buffer | null): Buffer;
//# sourceMappingURL=v1.d.mts.map