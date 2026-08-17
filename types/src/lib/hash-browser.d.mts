/**
 * Compute an MD5 digest (RFC 1321).
 * @param {Uint8Array} namespaceBytes - Namespace UUID bytes
 * @param {string} name - Name to hash
 * @returns {Uint8Array} 16-byte digest
 */
export function md5(namespaceBytes: Uint8Array, name: string): Uint8Array;
/**
 * Compute a SHA-1 digest (FIPS 180-1 / RFC 3174).
 * @param {Uint8Array} namespaceBytes - Namespace UUID bytes
 * @param {string} name - Name to hash
 * @returns {Uint8Array} 20-byte digest
 */
export function sha1(namespaceBytes: Uint8Array, name: string): Uint8Array;
//# sourceMappingURL=hash-browser.d.mts.map