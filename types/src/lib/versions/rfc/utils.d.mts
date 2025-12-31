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
//# sourceMappingURL=utils.d.mts.map