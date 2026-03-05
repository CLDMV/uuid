/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /src/lib/constants.mjs
 *	@Date: 2025-12-15T20:33:49-08:00 (1765859629)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-03-04 21:03:43 -08:00 (1772687023)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
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