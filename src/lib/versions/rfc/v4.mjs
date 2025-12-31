/**
 * RFC 4122 UUID Version 4 - Random UUID
 *
 * Generates UUIDs from random or pseudo-random numbers.
 */

import crypto from "crypto";
import { stringify } from "./utils.mjs";

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
