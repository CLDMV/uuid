/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /src/lib/versions/rfc/v6.mjs
 *	@Date: 2025-12-30T17:00:08-08:00 (1767142808)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T15:33:34-07:00 (1790980414)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * RFC 9562 UUID Version 6 - Timestamp-based UUID (reordered)
 *
 * Generates UUIDs based on timestamp with improved sorting characteristics.
 * This is a reordered version of UUID v1 for better database indexing.
 */

import { randomBytes } from "@cldmv/uuid/rng";
import { stringify, gregorianTicks } from "./utils.mjs";

/**
 * Create a version 6 (timestamp, reordered) UUID
 * @param {object} [options] - Optional parameters
 * @param {ArrayLike<number>} [options.node] - 6-byte node id (MAC address)
 * @param {number} [options.clockseq] - 14-bit clock sequence
 * @param {number} [options.msecs] - Timestamp in milliseconds since unix epoch
 * @param {number} [options.nsecs] - Additional 100-nanosecond intervals
 * @param {Uint8Array} [options.buf] - Buffer to write UUID into; when given, it is returned instead of a string
 * @param {number} [options.offset] - Offset in buffer to start writing
 * @returns {string|Uint8Array} UUID string or buffer
 */
export function v6(options = {}) {
	const buf = options.buf || new Uint8Array(16);
	const offset = options.offset || 0;

	// 60-bit count of 100-ns intervals since 1582-10-15, as a bigint (it is past 2^53)
	const ticks = gregorianTicks(options.msecs, options.nsecs);
	const timeHigh = (ticks >> 28n) & 0xffffffffn;
	const timeMid = Number((ticks >> 12n) & 0xffffn);
	const timeLow = Number(ticks & 0x0fffn);

	// v6 lays the time out most significant bits first, so ids sort by time
	// time_high (32 bits)
	buf[offset] = Number((timeHigh >> 24n) & 0xffn);
	buf[offset + 1] = Number((timeHigh >> 16n) & 0xffn);
	buf[offset + 2] = Number((timeHigh >> 8n) & 0xffn);
	buf[offset + 3] = Number(timeHigh & 0xffn);

	// time_mid (16 bits)
	buf[offset + 4] = timeMid >>> 8;
	buf[offset + 5] = timeMid & 0xff;

	// time_low_and_version (16 bits): version 6 in the top nibble, then time_low (12 bits)
	buf[offset + 6] = 0x60 | (timeLow >>> 8);
	buf[offset + 7] = timeLow & 0xff;

	// clock_seq and node (same as v1)
	let clockseq;
	if (options.clockseq !== undefined) {
		clockseq = options.clockseq;
	} else {
		const clockseqBytes = randomBytes(2);
		clockseq = (((clockseqBytes[0] << 8) | clockseqBytes[1]) & 0x3fff) | 0;
	}
	buf[offset + 8] = ((clockseq >>> 8) | 0x80) & 0xff;
	buf[offset + 9] = clockseq & 0xff;

	const node = options.node || randomBytes(6);
	for (let i = 0; i < 6; i++) {
		buf[offset + 10 + i] = node[i];
	}

	return options.buf ? buf : stringify(buf);
}
