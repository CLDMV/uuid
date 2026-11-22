/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /src/lib/timestamp.mjs
 *	@Date: 2026-11-21T12:52:13-08:00 (1795294333)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-21T12:52:13-08:00 (1795294333)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * Timestamp Variant encoding
 *
 * One place for reading and writing the signed 70-bit timestamp of the Timestamp
 * Variant (TA/TB, versions 1-4). The format holds a sign bit and a 69-bit
 * magnitude, so any whole number from -(2^69 - 1) to 2^69 - 1 round-trips
 * exactly: about ±18.7 trillion years in seconds, ±18.7 billion years in
 * milliseconds. Values are handled as bigint internally so nothing above 2^53
 * loses precision.
 *
 * Storage rule: the sign bit is 1 for zero and positive values, 0 for negative.
 * A positive value stores its magnitude as is; a negative value stores
 * (2^69 - 1) - |value|, so later times always have larger stored values.
 *
 * Bit positions of the 69-bit stored magnitude, by layout:
 * - "full" (versions 5 and 6): bits 68..6 at bits 1-63, bits 5..0 at bits 69-74. Most significant
 *   bit first across the whole magnitude, so byte order follows time over the full ±(2^69 - 1).
 * - "ordered" (versions 3 and 4): bits 62..32 at bits 1-31, bits 31..0 at bits 32-63, bits 68..63
 *   at bits 69-74. Byte order follows time within ±(2^63 - 1).
 * - "legacy" (versions 1 and 2): bits 31..0 at bits 1-32, bits 62..32 at bits 33-63, bits 68..63
 *   at bits 69-74. Byte order wraps every 2^32 units.
 */

import { BitUtils } from "./bit-utils.mjs";

/**
 * Magnitude layout of a timestamp version.
 * @typedef {"legacy"|"ordered"|"full"} TimestampLayout
 */

/** Largest magnitude the 69-bit field holds: 2^69 - 1. */
export const TIMESTAMP_MAX_MAGNITUDE = (1n << 69n) - 1n;

const INTEGER_STRING = /^-?\d+$/;

/**
 * Floor division for bigint (rounds toward -Infinity, as Math.floor does).
 * @param {bigint} a - Dividend
 * @param {bigint} b - Positive divisor
 * @returns {bigint} floor(a / b)
 */
function floorDiv(a, b) {
	const q = a / b;
	return a % b !== 0n && a < 0n ? q - 1n : q;
}

/**
 * Turn a timestamp input into an exact bigint in the stored unit, and check the format can hold it.
 *
 * - `bigint`: taken as is.
 * - `number`: must be finite. A fractional value is floored (toward -Infinity), so
 *   `UUID.TA(Date.now() / 1000)` stores the second it falls in, before and after 1970 alike.
 * - `string`: a decimal integer such as `"-590295810358705651711"` (the exact form that survives JSON).
 * - `Date`: its milliseconds, or the floor of its seconds when `precision` is `"s"`.
 *   A `Date` only spans about ±275,760 years; pass a number, bigint or string for times past that.
 *
 * @param {number|bigint|string|Date} value - Timestamp input
 * @param {"s"|"ms"} [precision] - Unit to convert a Date to: "s" for versions 1 and 3, "ms" (default) for 2 and 4
 * @returns {bigint} Timestamp in the stored unit
 * @throws {RangeError} When the value isn't a whole number the format holds, or a Date is invalid
 * @throws {TypeError} When the value is not a number, bigint, string or Date
 */
export function toTimestampBigInt(value, precision = "ms") {
	let result;
	if (typeof value === "bigint") {
		result = value;
	} else if (typeof value === "number") {
		if (!Number.isFinite(value)) {
			throw new RangeError(`Timestamp must be a finite number, got ${value}`);
		}
		result = BigInt(Math.floor(value));
	} else if (typeof value === "string") {
		if (!INTEGER_STRING.test(value)) {
			throw new RangeError(`Timestamp string must be a decimal integer, got ${JSON.stringify(value)}`);
		}
		result = BigInt(value);
	} else if (value instanceof Date) {
		const ms = value.getTime();
		if (Number.isNaN(ms)) {
			throw new RangeError("Timestamp Date is invalid");
		}
		result = precision === "s" ? floorDiv(BigInt(ms), 1000n) : BigInt(ms);
	} else {
		throw new TypeError(`Timestamp must be a number, bigint, string or Date, got ${value === null ? "null" : typeof value}`);
	}

	const magnitude = result < 0n ? -result : result;
	if (magnitude > TIMESTAMP_MAX_MAGNITUDE) {
		throw new RangeError(`Timestamp ${result} is outside the 70-bit range ±(2^69 - 1)`);
	}
	return result;
}

/**
 * Return a decoded timestamp as a number when that is exact, otherwise as a bigint.
 * @param {bigint} value - Decoded timestamp
 * @returns {number|bigint} A number for safe integers, the bigint past ±(2^53 - 1)
 */
export function toTimestampNumber(value) {
	const asNumber = Number(value);
	return Number.isSafeInteger(asNumber) ? asNumber : value;
}

/**
 * Write the 69-bit stored magnitude (already in negative-ordering form) into bits 1-63 and 69-74.
 * @param {Uint8Array} buffer - UUID buffer
 * @param {bigint} storedMagnitude - Stored 69-bit magnitude
 * @param {TimestampLayout} layout - Bit layout of the version being written
 */
export function writeStoredMagnitude(buffer, storedMagnitude, layout) {
	if (layout === "full") {
		const high63 = storedMagnitude >> 6n;
		BitUtils.setBits(buffer, 1, 31, Number(high63 >> 32n));
		BitUtils.setBits(buffer, 32, 32, Number(high63 & 0xffffffffn));
		BitUtils.setBits(buffer, 69, 6, Number(storedMagnitude & 0x3fn));
		return;
	}
	const upper31 = Number((storedMagnitude >> 32n) & 0x7fffffffn);
	const lower32 = Number(storedMagnitude & 0xffffffffn);
	if (layout === "ordered") {
		BitUtils.setBits(buffer, 1, 31, upper31);
		BitUtils.setBits(buffer, 32, 32, lower32);
	} else {
		BitUtils.setBits(buffer, 1, 32, lower32);
		BitUtils.setBits(buffer, 33, 31, upper31);
	}
	BitUtils.setBits(buffer, 69, 6, Number((storedMagnitude >> 63n) & 0x3fn));
}

/**
 * Read the 69-bit stored magnitude (negative-ordering form) from bits 1-63 and 69-74.
 * @param {Uint8Array} buffer - UUID buffer
 * @param {TimestampLayout} layout - Bit layout of the version being read
 * @returns {bigint} Stored 69-bit magnitude
 */
export function readStoredMagnitude(buffer, layout) {
	const bits69to74 = BigInt(BitUtils.getBitsAsNumber(buffer, 69, 6));
	if (layout === "full") {
		const high63 = (BigInt(BitUtils.getBitsAsNumber(buffer, 1, 31)) << 32n) | BigInt(BitUtils.getBitsAsNumber(buffer, 32, 32));
		return (high63 << 6n) | bits69to74;
	}
	let upper31;
	let lower32;
	if (layout === "ordered") {
		upper31 = BigInt(BitUtils.getBitsAsNumber(buffer, 1, 31));
		lower32 = BigInt(BitUtils.getBitsAsNumber(buffer, 32, 32));
	} else {
		lower32 = BigInt(BitUtils.getBitsAsNumber(buffer, 1, 32));
		upper31 = BigInt(BitUtils.getBitsAsNumber(buffer, 33, 31));
	}
	return lower32 | (upper31 << 32n) | (bits69to74 << 63n);
}

/**
 * Write a timestamp (sign bit + 69-bit magnitude) into a UUID buffer.
 * @param {Uint8Array} buffer - UUID buffer
 * @param {bigint} value - Timestamp in the stored unit, from {@link toTimestampBigInt}
 * @param {TimestampLayout} layout - Bit layout of the version being written
 */
export function writeTimestamp(buffer, value, layout) {
	const negative = value < 0n;
	BitUtils.setBits(buffer, 0, 1, negative ? 0 : 1);
	writeStoredMagnitude(buffer, negative ? TIMESTAMP_MAX_MAGNITUDE + value : value, layout);
}

/**
 * Read the timestamp (sign bit + 69-bit magnitude) from a UUID buffer, exactly.
 * @param {Uint8Array} buffer - UUID buffer
 * @param {TimestampLayout} layout - Bit layout of the version being read
 * @returns {bigint} Timestamp in the stored unit
 */
export function readTimestamp(buffer, layout) {
	const stored = readStoredMagnitude(buffer, layout);
	return BitUtils.getBitsAsNumber(buffer, 0, 1) === 1 ? stored : stored - TIMESTAMP_MAX_MAGNITUDE;
}
