/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /src/lib/versions/timestamp/v5.mjs
 *	@Date: 2026-11-21T17:19:54-08:00 (1795310394)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-21T17:19:54-08:00 (1795310394)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * Custom UUID Timestamp Variant v5
 *
 * Subvariant 00 - Timestamp-based identification with seconds precision
 * Ultra-short alias: TA
 *
 * Bit Layout:
 * - Bits 0: Sign bit (0 = negative, 1 = positive)
 * - Bits 1-63: Magnitude bits 68..6
 * - Bits 64-66: Variant (111)
 * - Bits 67-68: Subvariant (00)
 * - Bits 69-74: Magnitude bits 5..0 (most significant bit first across the whole magnitude, so byte order follows time across the full ±(2^69 - 1))
 * - Bits 75-78: Version (5)
 * - Bits 79-127: Entropy
 */

import crypto from "crypto";
import { BitUtils } from "../../bit-utils.mjs";
import { toTimestampBigInt, toTimestampNumber, writeTimestamp, readTimestamp } from "../../timestamp.mjs";
import { VARIANT_BITS, SUBVARIANT_TIMESTAMP, VERSION_START_BIT, VERSION_BIT_COUNT } from "../../constants.mjs";

/**
 * Create a Timestamp Variant v5 UUID (seconds precision)
 * @param {number|bigint|string|Date|null} timestamp - Timestamp value (optional, defaults to current time in seconds)
 * @param {Buffer|null} entropy - Optional entropy for bits 79-127
 * @returns {Buffer} 16-byte UUID buffer
 */
export function v5(timestamp = null, entropy = null) {
	const buffer = Buffer.alloc(16);
	const version = 5;

	// Use current time if timestamp not provided (seconds precision)
	const timestampValue = toTimestampBigInt(timestamp === undefined || timestamp === null ? Math.floor(Date.now() / 1000) : timestamp, "s");

	// Set variant (bits 64-66) = 111
	BitUtils.setBits(buffer, 64, 3, VARIANT_BITS);

	// Set subvariant (bits 67-68) = 00 (Timestamp Variant)
	BitUtils.setBits(buffer, 67, 2, SUBVARIANT_TIMESTAMP);

	// Set version (bits 75-78) = 5
	BitUtils.setBits(buffer, VERSION_START_BIT, VERSION_BIT_COUNT, version);

	// Fill entropy bits (79-127) if provided, or generate random entropy
	if (!entropy) {
		entropy = crypto.randomBytes(16);
	}

	// Copy entropy starting from bit 79 (byte 9, bit 7)
	// Bits 79-127 = 49 bits = 6.125 bytes
	// We'll copy bytes 9-15 from entropy, preserving already-set bits
	const entropyStartByte = 9;

	// Apply entropy while preserving immutable fields
	for (let i = entropyStartByte; i < 16; i++) {
		buffer[i] = entropy[i];
	}

	// Restore immutable fields that might have been overwritten by entropy
	BitUtils.setBits(buffer, 64, 3, VARIANT_BITS);
	BitUtils.setBits(buffer, 67, 2, SUBVARIANT_TIMESTAMP);
	BitUtils.setBits(buffer, VERSION_START_BIT, VERSION_BIT_COUNT, version);

	// Set timestamp AFTER entropy to ensure timestamp bits are not overwritten
	writeTimestamp(buffer, timestampValue, "full");

	return buffer;
}

/**
 * Alias for v5 - TA (Timestamp A - seconds precision)
 */
export const ta = v5;

/**
 * Parse timestamp from a Timestamp v5 UUID buffer
 * @param {Buffer} buffer - UUID buffer
 * @returns {number|bigint} Timestamp value in seconds: a number while it is a safe integer, an exact bigint past ±(2^53 - 1)
 */
export function parseTimestamp(buffer) {
	return toTimestampNumber(readTimestamp(buffer, "full"));
}
