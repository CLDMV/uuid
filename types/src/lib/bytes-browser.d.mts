/**
 * Parse a hex string into bytes.
 * @param {string} hex - Hex string (no separators)
 * @returns {Uint8Array} Parsed bytes
 */
export function fromHex(hex: string): Uint8Array;
/**
 * Encode bytes as a lowercase hex string.
 * @param {Uint8Array} bytes - Bytes to encode
 * @returns {string} Hex string
 */
export function toHex(bytes: Uint8Array): string;
/**
 * Return a copy of `bytes` as the runtime's native Buffer-like type.
 * There is no Buffer in the browser, so this is a plain Uint8Array copy.
 * @param {Uint8Array} bytes - Bytes to wrap
 * @returns {Uint8Array} Copy of the bytes
 */
export function toBufferLike(bytes: Uint8Array): Uint8Array;
//# sourceMappingURL=bytes-browser.d.mts.map