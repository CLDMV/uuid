/**
 * Custom UUID Timestamp Variant v1
 *
 * Subvariant 00 - Timestamp-based identification with seconds precision
 * Ultra-short alias: TA
 *
 * Bit Layout:
 * - Bits 0: Sign bit (0 = negative, 1 = positive)
 * - Bits 1-63: Lower 63 bits of timestamp magnitude
 * - Bits 64-66: Variant (111)
 * - Bits 67-68: Subvariant (00)
 * - Bits 69-74: Upper 6 bits of timestamp magnitude
 * - Bits 75-78: Version (1)
 * - Bits 79-127: Entropy
 */

import crypto from "crypto";
import { BitUtils } from "../../bit-utils.mjs";
import { VARIANT_BITS, SUBVARIANT_TIMESTAMP, VERSION_START_BIT, VERSION_BIT_COUNT } from "../../constants.mjs";

/**
 * Create a Timestamp Variant v1 UUID (seconds precision)
 * @param {number|Date|null} timestamp - Timestamp value (optional, defaults to current time in seconds)
 * @param {Buffer|null} entropy - Optional entropy for bits 79-127
 * @returns {Buffer} 16-byte UUID buffer
 */
export function v1(timestamp = null, entropy = null) {
	const buffer = Buffer.alloc(16);
	const version = 1;

	// Use current time if timestamp not provided (seconds precision)
	let timestampValue;
	if (timestamp === undefined || timestamp === null) {
		timestampValue = Math.floor(Date.now() / 1000); // seconds
	} else if (timestamp instanceof Date) {
		timestampValue = Math.floor(timestamp.getTime() / 1000); // seconds
	} else {
		timestampValue = timestamp;
	}

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
	setTimestamp(buffer, timestampValue);

	return buffer;
}

/**
 * Alias for v1 - TA (Timestamp A - seconds precision)
 */
export const ta = v1;

/**
 * Set 70-bit timestamp according to specification
 * @param {Buffer} buffer - UUID buffer
 * @param {number} timestampValue - Timestamp value in seconds
 * @private
 */
function setTimestamp(buffer, timestampValue) {
	// Handle sign bit (bit 0)
	const isNegative = timestampValue < 0;
	const absTimestamp = Math.abs(timestampValue);

	// Set sign bit: 0 = negative, 1 = positive
	BitUtils.setBits(buffer, 0, 1, isNegative ? 0 : 1);

	// Convert absolute timestamp to BigInt
	const absTimestampBig = BigInt(Math.floor(absTimestamp));

	// Apply negative timestamp ordering rule for storage
	// If negative: stored = (2^69 - 1) - abs(magnitude)
	// If positive: store magnitude directly
	let storedMagnitude;
	if (isNegative) {
		const maxValue = (BigInt(1) << BigInt(69)) - BigInt(1); // 2^69 - 1
		storedMagnitude = maxValue - absTimestampBig;
	} else {
		storedMagnitude = absTimestampBig;
	}

	// Split the stored magnitude into components
	// Set lower 32 bits (bits 1-32)
	const lower32 = Number(storedMagnitude & BigInt(0xffffffff));
	BitUtils.setBits(buffer, 1, 32, lower32);

	// Set middle 31 bits (bits 33-63)
	const middle31 = Number((storedMagnitude >> BigInt(32)) & BigInt(0x7fffffff));
	BitUtils.setBits(buffer, 33, 31, middle31);

	// Set upper 6 bits (bits 69-74)
	const upper6 = Number((storedMagnitude >> BigInt(63)) & BigInt(0x3f));
	BitUtils.setBits(buffer, 69, 6, upper6);
}

/**
 * Parse timestamp from a Timestamp v1 UUID buffer
 * @param {Buffer} buffer - UUID buffer
 * @returns {number} Timestamp value in seconds
 */
export function parseTimestamp(buffer) {
	// Extract sign bit (bit 0)
	const signBit = BitUtils.getBitsAsNumber(buffer, 0, 1);
	const isPositive = signBit === 1;

	// Extract timestamp magnitude from the 69 bits
	// Get lower 32 bits (bits 1-32)
	const lower32 = BigInt(BitUtils.getBitsAsNumber(buffer, 1, 32));

	// Get middle 31 bits (bits 33-63)
	const middle31 = BigInt(BitUtils.getBitsAsNumber(buffer, 33, 31));

	// Get upper 6 bits (bits 69-74)
	const upper6 = BigInt(BitUtils.getBitsAsNumber(buffer, 69, 6));

	// Reconstruct the stored 69-bit magnitude
	const storedMagnitude = lower32 | (middle31 << BigInt(32)) | (upper6 << BigInt(63));

	// Apply negative timestamp ordering rule
	let timestamp;
	if (isPositive) {
		timestamp = Number(storedMagnitude);
	} else {
		// Negative timestamp: decode using ordering rule
		const maxValue = (BigInt(1) << BigInt(69)) - BigInt(1); // 2^69 - 1
		const absMagnitude = maxValue - storedMagnitude;
		timestamp = -Number(absMagnitude);
	}

	return timestamp;
}
