/**
 * Convert UUID string to array of bytes
 * @param {string} uuid - UUID string with or without dashes
 * @returns {Uint8Array} 16-byte array
 * @example
 * parse('6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b');
 * // => Uint8Array(16) [110, 192, 189, 127, 17, 192, 67, 218, 151, 94, 42, 138, 217, 235, 174, 11]
 */
export function parse(uuid: string): Uint8Array;
/**
 * Convert array of bytes to UUID string
 * @param {Uint8Array|Buffer|Array} bytes - 16-byte array
 * @returns {string} UUID string with dashes
 * @example
 * stringify([110, 192, 189, 127, 17, 192, 67, 218, 151, 94, 42, 138, 217, 235, 174, 11]);
 * // => '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b'
 */
export function stringify(bytes: Uint8Array | Buffer | any[]): string;
/**
 * Test a string to see if it is a valid UUID
 * @param {string} uuid - UUID string to validate
 * @returns {boolean} True if valid UUID format
 * @example
 * validate('6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b'); // => true
 * validate('not-a-uuid'); // => false
 */
export function validate(uuid: string): boolean;
/**
 * Detect RFC version of a UUID
 * @param {string} uuid - UUID string to check
 * @returns {number|null} Version number (1-8) or null if invalid
 * @example
 * version('6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b'); // => 4
 */
export function version(uuid: string): number | null;
/**
 * Create a version 1 (timestamp) UUID
 * @param {Object} options - Optional parameters
 * @param {Array} options.node - 6-byte node id (MAC address)
 * @param {number} options.clockseq - 14-bit clock sequence
 * @param {number} options.msecs - Timestamp in milliseconds since unix epoch
 * @param {number} options.nsecs - Additional 100-nanosecond intervals
 * @param {Uint8Array} options.buf - Buffer to write UUID into
 * @param {number} options.offset - Offset in buffer to start writing
 * @returns {string|Uint8Array} UUID string or buffer
 */
export function v1(options?: {
    node: any[];
    clockseq: number;
    msecs: number;
    nsecs: number;
    buf: Uint8Array;
    offset: number;
}): string | Uint8Array;
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
/**
 * Create a version 5 (namespace with SHA-1) UUID
 * @param {string} name - Name to hash
 * @param {string|Uint8Array} namespace - Namespace UUID
 * @param {Uint8Array} buf - Optional buffer to write into
 * @param {number} offset - Optional offset in buffer
 * @returns {string|Uint8Array} UUID string or buffer
 */
export function v5(name: string, namespace: string | Uint8Array, buf: Uint8Array, offset: number): string | Uint8Array;
/**
 * Create a version 6 (timestamp, reordered) UUID
 * @param {Object} options - Optional parameters (same as v1)
 * @returns {string|Uint8Array} UUID string or buffer
 */
export function v6(options?: any): string | Uint8Array;
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
/**
 * The nil UUID string (all zeros)
 * @constant {string}
 */
export const NIL: "00000000-0000-0000-0000-000000000000";
/**
 * The max UUID string (all ones)
 * @constant {string}
 */
export const MAX: "ffffffff-ffff-ffff-ffff-ffffffffffff";
/**
 * Standard namespace UUIDs for v3 and v5
 */
export const DNS: "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
export const URL: "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
export const OID: "6ba7b812-9dad-11d1-80b4-00c04fd430c8";
export const X500: "6ba7b814-9dad-11d1-80b4-00c04fd430c8";
//# sourceMappingURL=rfc-uuids.d.mts.map