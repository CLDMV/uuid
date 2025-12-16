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
export const VARIANT_BITS = 0b111;

/**
 * Subvariant for Timestamp Variant (bits 67-68): 00
 * @constant {number}
 */
export const SUBVARIANT_TIMESTAMP = 0b00;

/**
 * Subvariant for Issuer Variant (bits 67-68): 01
 * @constant {number}
 */
export const SUBVARIANT_ISSUER = 0b01;

/**
 * Reserved subvariant values (bits 67-68): 10 and 11
 * @constant {number[]}
 */
export const SUBVARIANT_RESERVED = [0b10, 0b11];

/**
 * Reserved subvariant value 10 (bits 67-68): 10
 * @constant {number}
 */
export const SUBVARIANT_RESERVED_10 = 0b10;

/**
 * Reserved subvariant value 11 (bits 67-68): 11
 * @constant {number}
 */
export const SUBVARIANT_RESERVED_11 = 0b11;

/**
 * Version field start bit position
 * @constant {number}
 */
export const VERSION_START_BIT = 75;

/**
 * Version field bit count (bits 75-78)
 * @constant {number}
 */
export const VERSION_BIT_COUNT = 4;

/**
 * Issuer ID field start bit position (bits 79-88 per spec)
 * @constant {number}
 */
export const ISSUER_ID_START_BIT = 79;

/**
 * Issuer ID field bit count (bits 79-88, 10 bits for 0-1023)
 * @constant {number}
 */
export const ISSUER_ID_BIT_COUNT = 10;

/**
 * Issuer ID bit mask (10 bits: 1023 max value)
 * @constant {number}
 */
export const ISSUER_ID_MASK = 0x3ff;

/**
 * Issuer ID Categories
 * Defines the ranges and purposes of issuer IDs
 * @constant {Object}
 */
export const ISSUER_CATEGORIES = {
	UNASSIGNED: 0,
	DRAFTER_RESERVED: 1,
	CATEGORY_A_START: 2,
	CATEGORY_A_END: 255,
	CATEGORY_B_START: 256,
	CATEGORY_B_END: 511,
	SPEC_ORIGINATOR: 404,
	RFC_EXPANSION_START: 512,
	RFC_EXPANSION_END: 1023
};
