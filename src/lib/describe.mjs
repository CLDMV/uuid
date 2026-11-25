/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /src/lib/describe.mjs
 *	@Date: 2026-11-24T23:00:00-08:00 (1795590000)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-24T23:00:00-08:00 (1795590000)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * One decoder for every UUID, custom or RFC. `getInfo()`, the instance getters and
 * the validator all read from here, so a field means the same thing for every id
 * and is null when the id's variant doesn't define it.
 */

import { BitUtils } from "./bit-utils.mjs";
import {
	VARIANT_BITS,
	SUBVARIANT_TIMESTAMP,
	SUBVARIANT_ISSUER,
	ISSUER_ID_START_BIT,
	ISSUER_ID_BIT_COUNT,
	VERSION_START_BIT,
	VERSION_BIT_COUNT,
	timestampLayout,
	timestampUnit,
	issuerCategoryName,
	variantFamily
} from "./constants.mjs";
import { readTimestamp } from "./timestamp.mjs";

export const RFC_FAMILY = "RFC 4122/9562";

/** 100-ns intervals between 1582-10-15 (the RFC v1/v6 epoch) and 1970-01-01. */
const GREGORIAN_OFFSET_100NS = 122192928000000000n;

/** Timestamp units expressed in 100-ns ticks, the finest unit any UUID uses. */
const TICKS_PER_UNIT = { s: 10_000_000n, ms: 10_000n, "100ns": 1n };

/** Largest millisecond value a JavaScript Date can hold. */
const DATE_MAX_MS = 8_640_000_000_000_000n;

/**
 * @param {Uint8Array} bytes - 16 UUID bytes
 * @param {number} value - Byte value to test for
 * @returns {boolean} True when every byte equals `value`
 */
function every(bytes, value) {
	for (let i = 0; i < 16; i++) if (bytes[i] !== value) return false;
	return true;
}

/**
 * The variant bits and family of a UUID. The RFC 9562 Nil (all zeros) and Max (all
 * ones) ids belong to the RFC family even though their variant bits read 000 and 111.
 * @param {Uint8Array} bytes - 16 UUID bytes
 * @returns {{ variant: number, family: "NCS"|"RFC 4122/9562"|"Microsoft"|"Custom", isCustom: boolean, special: "nil"|"max"|null }} Classification
 */
export function classify(bytes) {
	const variant = BitUtils.getBitsAsNumber(bytes, 64, 3);
	let special = null;
	if (variant === 0 && every(bytes, 0x00)) special = "nil";
	else if (variant === VARIANT_BITS && every(bytes, 0xff)) special = "max";
	const isCustom = variant === VARIANT_BITS && special === null;
	return { variant, family: special ? RFC_FAMILY : variantFamily(variant), isCustom, special };
}

/**
 * Read the timestamp of an RFC version 1, 6 or 7 UUID on the Unix epoch.
 * @param {Uint8Array} bytes - 16 UUID bytes
 * @param {number} version - RFC version (bits 48-51)
 * @returns {{ value: bigint, unit: "ms"|"100ns" }|null} Timestamp, or null for versions without one
 */
export function readRfcTimestamp(bytes, version) {
	if (version === 7) {
		return { value: BitUtils.getBits(bytes, 0, 48), unit: "ms" };
	}
	if (version === 1 || version === 6) {
		const a = BitUtils.getBits(bytes, 0, 32);
		const b = BitUtils.getBits(bytes, 32, 16);
		const c = BitUtils.getBits(bytes, 52, 12);
		// v1: time_low | time_mid | time_hi; v6: time_high | time_mid | time_low
		const gregorian = version === 1 ? (c << 48n) | (b << 32n) | a : (a << 28n) | (b << 12n) | c;
		return { value: gregorian - GREGORIAN_OFFSET_100NS, unit: "100ns" };
	}
	return null;
}

/**
 * Convert a timestamp to 100-ns ticks, the common scale used to order ids by time.
 * @param {bigint} value - Timestamp in `unit`
 * @param {"s"|"ms"|"100ns"} unit - Unit of `value`
 * @returns {bigint} 100-ns ticks since the Unix epoch
 */
export function toTicks(value, unit) {
	return value * TICKS_PER_UNIT[unit];
}

/**
 * ISO 8601 date of a timestamp, or null when it falls outside what a Date can hold.
 * @param {bigint} value - Timestamp in `unit`
 * @param {"s"|"ms"|"100ns"} unit - Unit of `value`
 * @returns {string|null} ISO date string (millisecond precision)
 */
export function toISODate(value, unit) {
	const ticks = toTicks(value, unit);
	// floor toward -Infinity so pre-1970 sub-millisecond values land in their millisecond
	let ms = ticks / TICKS_PER_UNIT.ms;
	if (ticks < 0n && ticks % TICKS_PER_UNIT.ms !== 0n) ms -= 1n;
	if (ms > DATE_MAX_MS || ms < -DATE_MAX_MS) return null;
	return new Date(Number(ms)).toISOString();
}

/**
 * Name of a custom-variant id ("TA", "TB", "IA", ...).
 * @param {number} subvariant - Bits 67-68
 * @param {number} version - Bits 75-78
 * @returns {string} Identifier
 */
function customIdentifier(subvariant, version) {
	if (subvariant === SUBVARIANT_TIMESTAMP) {
		if (version === 1 || version === 3 || version === 5) return "TA";
		if (version === 2 || version === 4 || version === 6) return "TB";
		return `Timestamp v${version}`;
	}
	if (subvariant === SUBVARIANT_ISSUER) {
		return version === 1 ? "IA" : `Issuer v${version}`;
	}
	// Bits 67-68 hold 0-3, so the only values left are the reserved subvariants 10 and 11
	return `Reserved (subvariant ${subvariant})`;
}

/**
 * Describe any UUID with the same fields.
 * @param {Uint8Array} bytes - 16 UUID bytes
 * @returns {{
 *   isUUID: boolean,
 *   variant: number,
 *   variantFamily: "NCS"|"RFC 4122/9562"|"Microsoft"|"Custom",
 *   subvariant: number|null,
 *   version: number|null,
 *   variantIdentifier: string|number|null,
 *   issuerID: number|null,
 *   issuerCategory: string|null,
 *   timestamp: bigint|null,
 *   timestampUnit: "s"|"ms"|"100ns"|null,
 *   date: string|null,
 *   isIssuerVariant: boolean,
 *   isTimestampVariant: boolean
 * }} Description; `timestamp` is a bigint here, callers convert it
 */
export function describeBytes(bytes) {
	const { variant, family, isCustom, special } = classify(bytes);
	const info = {
		isUUID: isCustom,
		variant,
		variantFamily: family,
		subvariant: null,
		version: null,
		variantIdentifier: null,
		issuerID: null,
		issuerCategory: null,
		timestamp: null,
		timestampUnit: null,
		date: null,
		isIssuerVariant: false,
		isTimestampVariant: false
	};

	if (isCustom) {
		const subvariant = BitUtils.getBitsAsNumber(bytes, 67, 2);
		const version = BitUtils.getBitsAsNumber(bytes, VERSION_START_BIT, VERSION_BIT_COUNT);
		info.subvariant = subvariant;
		info.version = version;
		info.variantIdentifier = customIdentifier(subvariant, version);
		if (subvariant === SUBVARIANT_ISSUER) {
			info.isIssuerVariant = true;
			info.issuerID = BitUtils.getBitsAsNumber(bytes, ISSUER_ID_START_BIT, ISSUER_ID_BIT_COUNT);
			info.issuerCategory = issuerCategoryName(info.issuerID);
		} else if (subvariant === SUBVARIANT_TIMESTAMP) {
			info.isTimestampVariant = true;
			info.timestamp = readTimestamp(bytes, timestampLayout(version));
			info.timestampUnit = timestampUnit(version);
		}
	} else if (family === RFC_FAMILY) {
		const version = BitUtils.getBitsAsNumber(bytes, 48, 4);
		info.version = version;
		// Nil reads as 0 and Max as 15; any other RFC id needs a defined version (1-8)
		if (special || (version >= 1 && version <= 8)) {
			info.variantIdentifier = version;
		}
		if (!special) {
			const rfcTime = readRfcTimestamp(bytes, version);
			if (rfcTime) {
				info.timestamp = rfcTime.value;
				info.timestampUnit = rfcTime.unit;
			}
		}
	}

	if (info.timestamp !== null && info.timestampUnit !== null) {
		info.date = toISODate(info.timestamp, info.timestampUnit);
	}
	return info;
}
