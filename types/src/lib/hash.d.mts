/**
 * Compute an MD5 digest of namespaceBytes || utf8(name).
 * @param {Uint8Array} namespaceBytes - Namespace UUID bytes
 * @param {string} name - Name to hash
 * @returns {Uint8Array} 16-byte digest
 */
export function md5(namespaceBytes: Uint8Array, name: string): Uint8Array;
/**
 * Compute a SHA-1 digest of namespaceBytes || utf8(name).
 * @param {Uint8Array} namespaceBytes - Namespace UUID bytes
 * @param {string} name - Name to hash
 * @returns {Uint8Array} 20-byte digest
 */
export function sha1(namespaceBytes: Uint8Array, name: string): Uint8Array;
//# sourceMappingURL=hash.d.mts.map