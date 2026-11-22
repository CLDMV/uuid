/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /src/lib/versions/timestamp/v1.mjs
 *	@Date: 2025-12-30T17:00:08-08:00 (1767142808)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-21T12:52:12-08:00 (1795294332)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * Custom UUID Timestamp Variant v1
 *
 * Subvariant 00 - Timestamp-based identification with seconds precision
 * Legacy layout; the ultra-short alias TA now refers to v3 (ordered layout).
 *
 * Bit Layout:
 * - Bits 0: Sign bit (0 = negative, 1 = positive)
 * - Bits 1-32: Lower 32 bits of timestamp magnitude
 * - Bits 33-63: Magnitude bits 62..32 (legacy low-word-first layout; kept so ids minted before versions 3 and 4 decode unchanged, new ids use v3)
 * - Bits 64-66: Variant (111)
 * - Bits 67-68: Subvariant (00)
 * - Bits 69-74: Upper 6 bits of timestamp magnitude
 * - Bits 75-78: Version (1)
 * - Bits 79-127: Entropy
 */

import crypto from "crypto";
import { BitUtils } from "../../bit-utils.mjs";
import { toTimestampBigInt, toTimestampNumber, writeTimestamp, readTimestamp } from "../../timestamp.mjs";
import { VARIANT_BITS, SUBVARIANT_TIMESTAMP, VERSION_START_BIT, VERSION_BIT_COUNT } from "../../constants.mjs";

/**
 * Create a Timestamp Variant v1 UUID (seconds precision)
 * @param {number|bigint|string|Date|null} timestamp - Timestamp value (optional, defaults to current time in seconds)
 * @param {Buffer|null} entropy - Optional entropy for bits 79-127
 * @returns {Buffer} 16-byte UUID buffer
 */
export function v1(timestamp = null, entropy = null) {
	const buffer = Buffer.alloc(16);
	const version = 1;

	// Use current time if timestamp not provided (seconds precision)
	const timestampValue = toTimestampBigInt(timestamp === undefined || timestamp === null ? Math.floor(Date.now() / 1000) : timestamp, "s");

	// Set variant (bits 64-66) = 111
	BitUtils.setBits(buffer, 64, 3, VARIANT_BITS);

	// Set subvariant (bits 67-68) = 00 (Timestamp Variant)
	BitUtils.setBits(buffer, 67, 2, SUBVARIANT_TIMESTAMP);

	// Set version (bits 75-78) = 1
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
	writeTimestamp(buffer, timestampValue, "legacy");

	return buffer;
}

/**
 * Parse timestamp from a Timestamp v1 UUID buffer
 * @param {Buffer} buffer - UUID buffer
 * @returns {number|bigint} Timestamp value in seconds: a number while it is a safe integer, an exact bigint past ±(2^53 - 1)
 */
export function parseTimestamp(buffer) {
	return toTimestampNumber(readTimestamp(buffer, "legacy"));
}
