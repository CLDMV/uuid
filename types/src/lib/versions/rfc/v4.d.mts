/**
 * Create a version 4 (random) UUID
 * @param {Object} options - Optional parameters
 * @param {Uint8Array} options.random - 16 random bytes
 * @param {Uint8Array} options.buf - Buffer to write UUID into
 * @param {number} options.offset - Offset in buffer to start writing
 * @returns {string|Uint8Array} UUID string or buffer
 */
export function v4(options?: {
    random: Uint8Array;
    buf: Uint8Array;
    offset: number;
}): string | Uint8Array;
//# sourceMappingURL=v4.d.mts.map