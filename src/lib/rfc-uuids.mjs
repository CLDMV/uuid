/**
 * RFC 4122 and RFC 9562 UUID Implementation
 *
 * Standard UUID versions (v1, v3, v4, v5, v6, v7) and utility functions
 * compatible with the uuid npm package API.
 */

import crypto from "crypto";

/**
 * The nil UUID string (all zeros)
 * @constant {string}
 */
export const NIL = "00000000-0000-0000-0000-000000000000";

/**
 * The max UUID string (all ones)
 * @constant {string}
 */
export const MAX = "ffffffff-ffff-ffff-ffff-ffffffffffff";

/**
 * Convert UUID string to array of bytes
 * @param {string} uuid - UUID string with or without dashes
 * @returns {Uint8Array} 16-byte array
 * @example
 * parse('6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b');
 * // => Uint8Array(16) [110, 192, 189, 127, 17, 192, 67, 218, 151, 94, 42, 138, 217, 235, 174, 11]
 */
export function parse(uuid) {
	if (typeof uuid !== "string") {
		throw new TypeError("UUID must be a string");
	}

	// Remove dashes
	const hex = uuid.replace(/-/g, "");

	if (hex.length !== 32) {
		throw new TypeError("Invalid UUID string length");
	}

	if (!/^[0-9a-fA-F]{32}$/.test(hex)) {
		throw new TypeError("Invalid UUID string format");
	}

	const bytes = new Uint8Array(16);
	for (let i = 0; i < 16; i++) {
		bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}

	return bytes;
}

/**
 * Convert array of bytes to UUID string
 * @param {Uint8Array|Buffer|Array} bytes - 16-byte array
 * @returns {string} UUID string with dashes
 * @example
 * stringify([110, 192, 189, 127, 17, 192, 67, 218, 151, 94, 42, 138, 217, 235, 174, 11]);
 * // => '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b'
 */
export function stringify(bytes) {
	if (!bytes || bytes.length !== 16) {
		throw new TypeError("Bytes must be a 16-byte array");
	}

	const hex = Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Test a string to see if it is a valid UUID
 * @param {string} uuid - UUID string to validate
 * @returns {boolean} True if valid UUID format
 * @example
 * validate('6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b'); // => true
 * validate('not-a-uuid'); // => false
 */
export function validate(uuid) {
	if (typeof uuid !== "string") {
		return false;
	}

	// Special cases: NIL and MAX UUIDs
	if (uuid === NIL || uuid === MAX) {
		return true;
	}

	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(uuid);
}

/**
 * Detect RFC version of a UUID
 * @param {string} uuid - UUID string to check
 * @returns {number|null} Version number (1-8) or null if invalid
 * @example
 * version('6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b'); // => 4
 */
export function version(uuid) {
	if (!validate(uuid)) {
		return null;
	}

	// Version is in the 13th character (after removing dashes, byte 6, high nibble)
	const hex = uuid.replace(/-/g, "");
	const versionChar = hex.charAt(12);
	return parseInt(versionChar, 16);
}

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
export function v1(options = {}) {
	const buf = options.buf || new Uint8Array(16);
	const offset = options.offset || 0;

	// Get timestamp
	let msecs = options.msecs !== undefined ? options.msecs : Date.now();
	let nsecs = options.nsecs !== undefined ? options.nsecs : 0;

	// UUID epoch is October 15, 1582. Unix epoch is January 1, 1970.
	// The difference is 12219292800000 milliseconds
	const UUID_EPOCH_OFFSET = 12219292800000;
	msecs += UUID_EPOCH_OFFSET;

	// Convert to 100-nanosecond intervals
	const ticks = msecs * 10000 + nsecs;

	// time_low (32 bits)
	buf[offset] = (ticks >>> 24) & 0xff;
	buf[offset + 1] = (ticks >>> 16) & 0xff;
	buf[offset + 2] = (ticks >>> 8) & 0xff;
	buf[offset + 3] = ticks & 0xff;

	// time_mid (16 bits)
	buf[offset + 4] = ((ticks / 0x100000000) >>> 8) & 0xff;
	buf[offset + 5] = (ticks / 0x100000000) & 0xff;

	// time_hi_and_version (16 bits)
	buf[offset + 6] = (((ticks / 0x1000000000000) & 0x0f) | 0x10) & 0xff; // version 1
	buf[offset + 7] = ((ticks / 0x10000000000) >>> 0) & 0xff;

	// clock_seq_hi_and_reserved (8 bits)
	const clockseq = options.clockseq !== undefined ? options.clockseq : (crypto.randomBytes(2).readUInt16BE(0) & 0x3fff) | 0;
	buf[offset + 8] = ((clockseq >>> 8) | 0x80) & 0xff; // variant 10

	// clock_seq_low (8 bits)
	buf[offset + 9] = clockseq & 0xff;

	// node (48 bits)
	const node = options.node || crypto.randomBytes(6);
	for (let i = 0; i < 6; i++) {
		buf[offset + 10 + i] = node[i];
	}

	return options.buf ? buf : stringify(buf);
}

/**
 * Create a version 3 (namespace with MD5) UUID
 * @param {string} name - Name to hash
 * @param {string|Uint8Array} namespace - Namespace UUID
 * @param {Uint8Array} buf - Optional buffer to write into
 * @param {number} offset - Optional offset in buffer
 * @returns {string|Uint8Array} UUID string or buffer
 */
export function v3(name, namespace, buf, offset) {
	return _v35(name, namespace, 0x30, crypto.createHash("md5"), buf, offset);
}

/**
 * Create a version 4 (random) UUID
 * @param {Object} options - Optional parameters
 * @param {Uint8Array} options.random - 16 random bytes
 * @param {Uint8Array} options.buf - Buffer to write UUID into
 * @param {number} options.offset - Offset in buffer to start writing
 * @returns {string|Uint8Array} UUID string or buffer
 */
export function v4(options = {}) {
	const buf = options.buf || new Uint8Array(16);
	const offset = options.offset || 0;

	const randomBytes = options.random || crypto.randomBytes(16);
	for (let i = 0; i < 16; i++) {
		buf[offset + i] = randomBytes[i];
	}

	// Set version (4 bits in byte 6)
	buf[offset + 6] = (buf[offset + 6] & 0x0f) | 0x40;

	// Set variant (2 bits in byte 8)
	buf[offset + 8] = (buf[offset + 8] & 0x3f) | 0x80;

	return options.buf ? buf : stringify(buf);
}

/**
 * Create a version 5 (namespace with SHA-1) UUID
 * @param {string} name - Name to hash
 * @param {string|Uint8Array} namespace - Namespace UUID
 * @param {Uint8Array} buf - Optional buffer to write into
 * @param {number} offset - Optional offset in buffer
 * @returns {string|Uint8Array} UUID string or buffer
 */
export function v5(name, namespace, buf, offset) {
	return _v35(name, namespace, 0x50, crypto.createHash("sha1"), buf, offset);
}

/**
 * Create a version 6 (timestamp, reordered) UUID
 * @param {Object} options - Optional parameters (same as v1)
 * @returns {string|Uint8Array} UUID string or buffer
 */
export function v6(options = {}) {
	const buf = options.buf || new Uint8Array(16);
	const offset = options.offset || 0;

	// Get timestamp
	let msecs = options.msecs !== undefined ? options.msecs : Date.now();
	let nsecs = options.nsecs !== undefined ? options.nsecs : 0;

	const UUID_EPOCH_OFFSET = 12219292800000;
	msecs += UUID_EPOCH_OFFSET;

	const ticks = msecs * 10000 + nsecs;

	// v6 reorders timestamp to be monotonic
	// time_high (32 bits) - most significant bits
	buf[offset] = (ticks / 0x1000000000000) & 0xff;
	buf[offset + 1] = (ticks / 0x10000000000) & 0xff;
	buf[offset + 2] = (ticks / 0x100000000) & 0xff;
	buf[offset + 3] = ((ticks / 0x1000000) >>> 0) & 0xff;

	// time_mid (16 bits)
	buf[offset + 4] = (ticks >>> 16) & 0xff;
	buf[offset + 5] = (ticks >>> 8) & 0xff;

	// time_low_and_version (16 bits)
	buf[offset + 6] = ((ticks & 0x0f) | 0x60) & 0xff; // version 6
	buf[offset + 7] = ticks & 0xff;

	// clock_seq and node (same as v1)
	const clockseq = options.clockseq !== undefined ? options.clockseq : (crypto.randomBytes(2).readUInt16BE(0) & 0x3fff) | 0;
	buf[offset + 8] = ((clockseq >>> 8) | 0x80) & 0xff;
	buf[offset + 9] = clockseq & 0xff;

	const node = options.node || crypto.randomBytes(6);
	for (let i = 0; i < 6; i++) {
		buf[offset + 10 + i] = node[i];
	}

	return options.buf ? buf : stringify(buf);
}

/**
 * Create a version 7 (Unix Epoch time-based) UUID
 * @param {Object} options - Optional parameters
 * @param {number} options.msecs - Timestamp in milliseconds since unix epoch
 * @param {Uint8Array} options.buf - Buffer to write UUID into
 * @param {number} options.offset - Offset in buffer to start writing
 * @returns {string|Uint8Array} UUID string or buffer
 */
export function v7(options = {}) {
	const buf = options.buf || new Uint8Array(16);
	const offset = options.offset || 0;

	const msecs = options.msecs !== undefined ? options.msecs : Date.now();

	// unix_ts_ms (48 bits) - Unix timestamp in milliseconds
	buf[offset] = (msecs / 0x10000000000) & 0xff;
	buf[offset + 1] = (msecs / 0x100000000) & 0xff;
	buf[offset + 2] = (msecs >>> 24) & 0xff;
	buf[offset + 3] = (msecs >>> 16) & 0xff;
	buf[offset + 4] = (msecs >>> 8) & 0xff;
	buf[offset + 5] = msecs & 0xff;

	// ver (4 bits) + rand_a (12 bits)
	const randBytes = crypto.randomBytes(10);
	buf[offset + 6] = (randBytes[0] & 0x0f) | 0x70; // version 7
	buf[offset + 7] = randBytes[1];

	// var (2 bits) + rand_b (62 bits)
	buf[offset + 8] = (randBytes[2] & 0x3f) | 0x80; // variant 10
	for (let i = 3; i < 10; i++) {
		buf[offset + 6 + i] = randBytes[i];
	}

	return options.buf ? buf : stringify(buf);
}

/**
 * Internal function for v3 and v5 UUID generation
 * @private
 */
function _v35(name, namespace, versionByte, hasher, buf, offset) {
	const _buf = buf || new Uint8Array(16);
	const _offset = offset || 0;

	// Parse namespace
	let namespaceBytes;
	if (typeof namespace === "string") {
		namespaceBytes = parse(namespace);
	} else {
		namespaceBytes = namespace;
	}

	// Hash namespace + name
	hasher.update(Buffer.from(namespaceBytes));
	hasher.update(name, "utf8");
	const hash = hasher.digest();

	// Copy first 16 bytes of hash to buffer
	for (let i = 0; i < 16; i++) {
		_buf[_offset + i] = hash[i];
	}

	// Set version
	_buf[_offset + 6] = (_buf[_offset + 6] & 0x0f) | versionByte;

	// Set variant
	_buf[_offset + 8] = (_buf[_offset + 8] & 0x3f) | 0x80;

	return buf ? _buf : stringify(_buf);
}

/**
 * Standard namespace UUIDs for v3 and v5
 */
export const DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
export const URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
export const OID = "6ba7b812-9dad-11d1-80b4-00c04fd430c8";
export const X500 = "6ba7b814-9dad-11d1-80b4-00c04fd430c8";
