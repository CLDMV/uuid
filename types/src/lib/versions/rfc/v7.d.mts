/**
 * Create a version 7 (Unix Epoch time-based) UUID
 * @param {Object} options - Optional parameters
 * @param {number} options.msecs - Timestamp in milliseconds since unix epoch
 * @param {Uint8Array} options.buf - Buffer to write UUID into
 * @param {number} options.offset - Offset in buffer to start writing
 * @returns {string|Uint8Array} UUID string or buffer
 */
export function v7(options?: {
    msecs: number;
    buf: Uint8Array;
    offset: number;
}): string | Uint8Array;
//# sourceMappingURL=v7.d.mts.map