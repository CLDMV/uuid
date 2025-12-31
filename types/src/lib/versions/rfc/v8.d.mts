/**
 * Create a version 8 (custom/experimental) UUID
 * @param {Object} options - Optional parameters
 * @param {Uint8Array} options.data - Custom data to fill the UUID (16 bytes)
 * @param {Uint8Array} options.buf - Buffer to write UUID into
 * @param {number} options.offset - Offset in buffer to start writing
 * @returns {string|Uint8Array} UUID string or buffer
 * @example
 * // Generate with random data
 * v8();
 *
 * // Generate with custom data
 * const customData = new Uint8Array(16);
 * // Fill customData with your application-specific data
 * v8({ data: customData });
 */
export function v8(options?: {
    data: Uint8Array;
    buf: Uint8Array;
    offset: number;
}): string | Uint8Array;
//# sourceMappingURL=v8.d.mts.map