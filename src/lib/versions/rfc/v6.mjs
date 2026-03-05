/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /src/lib/versions/rfc/v6.mjs
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
 * RFC 9562 UUID Version 6 - Timestamp-based UUID (reordered)
 *
 * Generates UUIDs based on timestamp with improved sorting characteristics.
 * This is a reordered version of UUID v1 for better database indexing.
 */

import crypto from "crypto";
import { stringify } from "./utils.mjs";

/**
 * Create a version 6 (timestamp, reordered) UUID
 * @param {Object} options - Optional parameters
 * @param {Array} options.node - 6-byte node id (MAC address)
 * @param {number} options.clockseq - 14-bit clock sequence
 * @param {number} options.msecs - Timestamp in milliseconds since unix epoch
 * @param {number} options.nsecs - Additional 100-nanosecond intervals
 * @param {Uint8Array} options.buf - Buffer to write UUID into
 * @param {number} options.offset - Offset in buffer to start writing
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
