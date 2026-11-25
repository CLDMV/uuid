/**
 * Whether a timestamp version stores seconds (versions 1, 3 and 5) rather than milliseconds
 * @param {number} version - Timestamp variant version
 * @returns {boolean} True for seconds precision
 */
export function isSecondsVersion(version: number): boolean;
/**
 * The magnitude layout a timestamp version uses. Versions other than 3-6, including 1 and 2, read as the legacy layout so ids minted before the ordered layout decode unchanged.
 * @param {number} version - Timestamp variant version
 * @returns {import("./timestamp.mjs").TimestampLayout} "full" for 5 and 6, "ordered" for 3 and 4, "legacy" otherwise
 */
export function timestampLayout(version: number): import("./timestamp.mjs").TimestampLayout;
/**
 * Name of the category an issuer ID belongs to (spec section 10).
 * @param {number} issuerID - Issuer ID (0-ISSUER_ID_MASK)
 * @returns {string} Category name, or "Unknown" outside 0-ISSUER_ID_MASK
 */
export function issuerCategoryName(issuerID: number): string;
/**
 * Name of the variant family selected by bits 64-66 (spec section 4, RFC 9562 section 4.1).
 * @param {number} variant - Bits 64-66 as a number (0-7)
 * @returns {"NCS"|"RFC 4122/9562"|"Microsoft"|"CLDMV"} Variant family; "CLDMV" is variant 111, the namespace this library defines
 */
export function variantFamily(variant: number): "NCS" | "RFC 4122/9562" | "Microsoft" | "CLDMV";
/**
 * Timestamp unit of a Timestamp Variant version.
 * @param {number} version - Timestamp variant version
 * @returns {"s"|"ms"|null} "s" for versions 1, 3 and 5, "ms" for 2, 4 and 6, null for versions not defined yet
 */
export function timestampUnit(version: number): "s" | "ms" | null;
/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /src/lib/constants.mjs
 *	@Date: 2025-12-15T20:33:49-08:00 (1765859629)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-02T21:25:21-08:00 (1793683521)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */
/**
 * Constants for Custom UUID Implementation
 *
 * Defines core bit patterns and field values used throughout the UUID system.
 * These values are immutable and should never be modified during UUID operations.
 */
/**
 * Variant bits (bits 64-66): 111 - Entry into custom namespace
 * @constant {number}
 */
export const VARIANT_BITS: 7;
/**
 * Subvariant for Timestamp Variant (bits 67-68): 00
 * @constant {number}
 */
export const SUBVARIANT_TIMESTAMP: 0;
/**
 * Subvariant for Issuer Variant (bits 67-68): 01
 * @constant {number}
 */
export const SUBVARIANT_ISSUER: 1;
/**
 * Reserved subvariant values (bits 67-68): 10 and 11
 * @constant {number[]}
 */
export const SUBVARIANT_RESERVED: number[];
/**
 * Reserved subvariant value 10 (bits 67-68): 10
 * @constant {number}
 */
export const SUBVARIANT_RESERVED_10: 2;
/**
 * Reserved subvariant value 11 (bits 67-68): 11
 * @constant {number}
 */
export const SUBVARIANT_RESERVED_11: 3;
/**
 * Version field start bit position
 * @constant {number}
 */
export const VERSION_START_BIT: 75;
/**
 * Version field bit count (bits 75-78)
 * @constant {number}
 */
export const VERSION_BIT_COUNT: 4;
/**
 * Timestamp versions that store seconds: 1 (legacy layout), 3 (ordered layout) and 5 (full layout). Every other timestamp version stores milliseconds.
 * @constant {number[]}
 */
export const TIMESTAMP_SECONDS_VERSIONS: number[];
/**
 * Timestamp versions in the ordered layout (magnitude bits 62..0 most significant bit first in segment A, bits 68..63 at bits 69-74): 3 (seconds) and 4 (milliseconds).
 * @constant {number[]}
 */
export const TIMESTAMP_ORDERED_VERSIONS: number[];
/**
 * Timestamp versions in the full layout (magnitude bits 68..6 in segment A, bits 5..0 at bits 69-74, so byte order follows time across the whole range): 5 (seconds) and 6 (milliseconds). TA and TB mint these.
 * @constant {number[]}
 */
export const TIMESTAMP_FULL_VERSIONS: number[];
/**
 * Issuer ID field start bit position (bits 79-88 per spec)
 * @constant {number}
 */
export const ISSUER_ID_START_BIT: 79;
/**
 * Issuer ID field bit count (bits 79-88, 10 bits for 0-1023)
 * @constant {number}
 */
export const ISSUER_ID_BIT_COUNT: 10;
/**
 * Issuer ID bit mask (10 bits: 1023 max value)
 * @constant {number}
 */
export const ISSUER_ID_MASK: 1023;
export namespace ISSUER_CATEGORIES {
    let UNASSIGNED: number;
    let DRAFTER_RESERVED: number;
    let CATEGORY_A_START: number;
    let CATEGORY_A_END: number;
    let CATEGORY_B_START: number;
    let CATEGORY_B_END: number;
    let SPEC_ORIGINATOR: number;
    let RFC_EXPANSION_START: number;
    let RFC_EXPANSION_END: number;
}
/**
 * RFC 4122/9562 Standard UUID Constants
 */
/**
 * The nil UUID string (all zeros)
 * @constant {string}
 */
export const NIL: "00000000-0000-0000-0000-000000000000";
/**
 * The max UUID string (all ones)
 * @constant {string}
 */
export const MAX: "ffffffff-ffff-ffff-ffff-ffffffffffff";
/**
 * Standard namespace UUIDs for v3 and v5
 */
/**
 * DNS namespace UUID
 * @constant {string}
 */
export const DNS: "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
/**
 * URL namespace UUID
 * @constant {string}
 */
export const URL: "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
/**
 * OID namespace UUID
 * @constant {string}
 */
export const OID: "6ba7b812-9dad-11d1-80b4-00c04fd430c8";
/**
 * X500 namespace UUID
 * @constant {string}
 */
export const X500: "6ba7b814-9dad-11d1-80b4-00c04fd430c8";
//# sourceMappingURL=constants.d.mts.map