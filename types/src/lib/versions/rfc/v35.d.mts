/**
 * Create a version 3 (namespace with MD5) UUID
 * @param {string} name - Name to hash
 * @param {string|Uint8Array} namespace - Namespace UUID
 * @param {Uint8Array} buf - Optional buffer to write into
 * @param {number} offset - Optional offset in buffer
 * @returns {string|Uint8Array} UUID string or buffer
 */
export function v3(name: string, namespace: string | Uint8Array, buf: Uint8Array, offset: number): string | Uint8Array;
/**
 * Create a version 5 (namespace with SHA-1) UUID
 * @param {string} name - Name to hash
 * @param {string|Uint8Array} namespace - Namespace UUID
 * @param {Uint8Array} buf - Optional buffer to write into
 * @param {number} offset - Optional offset in buffer
 * @returns {string|Uint8Array} UUID string or buffer
 */
export function v5(name: string, namespace: string | Uint8Array, buf: Uint8Array, offset: number): string | Uint8Array;
//# sourceMappingURL=v35.d.mts.map