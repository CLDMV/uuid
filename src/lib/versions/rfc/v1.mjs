/**
 * RFC 4122 UUID Version 1 - Timestamp-based UUID
 *
 * Generates UUIDs based on timestamp and node (MAC address) information.
 */

import crypto from "crypto";
import { stringify } from "./utils.mjs";

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
