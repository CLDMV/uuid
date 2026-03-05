/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /src/lib/versions/rfc/utils.mjs
 *	@Date: 2025-12-30T17:00:08-08:00 (1767142808)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-03-04 21:03:44 -08:00 (1772687024)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * RFC 4122/9562 UUID Utility Functions
 *
 * Core utilities for parsing, stringifying, validating, and detecting UUID versions.
 */

import { NIL, MAX } from "../../constants.mjs";

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
