/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /src/lib/versions/rfc/v7.mjs
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
 * RFC 9562 UUID Version 7 - Unix Epoch time-based UUID
 *
 * Generates UUIDs based on Unix timestamp in milliseconds with random data.
 * Optimized for database indexing and distributed systems.
 */

import crypto from "crypto";
import { stringify } from "./utils.mjs";

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
