/**
 * RFC 9562 UUID Version 8 - Custom/Experimental UUID
 *
 * Version 8 provides an RFC-compatible format for experimental or vendor-specific
 * UUID formats. The only requirement is that the variant and version bits are set
 * correctly; all other bits can be filled with custom data.
 */

import crypto from "crypto";
import { stringify } from "./utils.mjs";

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
export function v8(options = {}) {
	const buf = options.buf || new Uint8Array(16);
	const offset = options.offset || 0;

	// Use custom data if provided, otherwise random
	const data = options.data || crypto.randomBytes(16);

	// Copy data to buffer
	for (let i = 0; i < 16; i++) {
		buf[offset + i] = data[i];
	}

	// Set version (4 bits in byte 6, high nibble) = 8
	buf[offset + 6] = (buf[offset + 6] & 0x0f) | 0x80;

	// Set variant (2 bits in byte 8, high 2 bits) = 10
	buf[offset + 8] = (buf[offset + 8] & 0x3f) | 0x80;

	return options.buf ? buf : stringify(buf);
}
