/**
 * Custom UUID Issuer Variant v1
 *
 * Subvariant 01 - Issuer-based identification
 * Ultra-short alias: IA
 *
 * Bit Layout:
 * - Bits 0-63: Entropy/random data
 * - Bits 64-66: Variant (111)
 * - Bits 67-68: Subvariant (01)
 * - Bits 69-74: Entropy/reserved
 * - Bits 75-78: Version (1)
 * - Bits 79-88: Issuer ID (10 bits, 0-1023)
 * - Bits 89-127: Entropy/random data
 */

import crypto from "crypto";
import { BitUtils } from "../../bit-utils.mjs";
import {
	VARIANT_BITS,
	SUBVARIANT_ISSUER,
	VERSION_START_BIT,
	VERSION_BIT_COUNT,
	ISSUER_ID_START_BIT,
	ISSUER_ID_BIT_COUNT,
	ISSUER_ID_MASK
} from "../../constants.mjs";

/**
 * Create an Issuer Variant v1 UUID
 * @param {number} issuerID - Issuer ID (0-1023)
 * @param {Buffer|null} entropy - Optional entropy data (full 16 bytes)
 * @returns {Buffer} 16-byte UUID buffer
 */
export function v1(issuerID, entropy = null) {
	const buffer = Buffer.alloc(16);
	const version = 1;

	// Validate issuer ID
	if (!Number.isInteger(issuerID) || issuerID < 0 || issuerID > ISSUER_ID_MASK) {
		throw new Error(`Invalid issuer ID: ${issuerID}. Must be 0-${ISSUER_ID_MASK}.`);
	}

	// Fill buffer with entropy first
	if (!entropy) {
		entropy = crypto.randomBytes(16);
	}
	entropy.copy(buffer);

	// Set variant (bits 64-66) = 111
	BitUtils.setBits(buffer, 64, 3, VARIANT_BITS);

	// Set subvariant (bits 67-68) = 01 (Issuer Variant)
	BitUtils.setBits(buffer, 67, 2, SUBVARIANT_ISSUER);

	// Set version (bits 75-78) = 1
	BitUtils.setBits(buffer, VERSION_START_BIT, VERSION_BIT_COUNT, version);

	// Set issuer ID (bits 79-88)
	BitUtils.setBits(buffer, ISSUER_ID_START_BIT, ISSUER_ID_BIT_COUNT, issuerID);

	return buffer;
}

/**
 * Alias for v1 - IA (Issuer A)
 */
export const ia = v1;

/**
 * Parse issuer ID from an Issuer v1 UUID buffer
 * @param {Buffer} buffer - UUID buffer
 * @returns {number} Issuer ID (0-1023)
 */
export function parseIssuerID(buffer) {
	return BitUtils.getBitsAsNumber(buffer, ISSUER_ID_START_BIT, ISSUER_ID_BIT_COUNT);
}

/**
 * Validate issuer ID is within allowed range
 * @param {number} issuerID - Issuer ID to validate
 * @returns {boolean} True if valid
 */
export function validateIssuerID(issuerID) {
	return Number.isInteger(issuerID) && issuerID >= 0 && issuerID <= ISSUER_ID_MASK;
}

/**
 * Get issuer category name for a given issuer ID
 * @param {number} issuerID - Issuer ID (0-1023)
 * @returns {string} Category name
 */
export function getIssuerCategory(issuerID) {
	// Import constants directly for category checking
	const categories = {
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

	if (issuerID === categories.UNASSIGNED) return "Unassigned";
	if (issuerID === categories.DRAFTER_RESERVED) return "Drafter Reserved";
	if (issuerID === categories.SPEC_ORIGINATOR) return "Spec Originator";
	if (issuerID >= categories.CATEGORY_A_START && issuerID <= categories.CATEGORY_A_END) {
		return "Category A (Well-Recognized Tech Entities)";
	}
	if (issuerID >= categories.CATEGORY_B_START && issuerID <= categories.CATEGORY_B_END) {
		return "Category B (Open Source Contributors)";
	}
	if (issuerID >= categories.RFC_EXPANSION_START && issuerID <= categories.RFC_EXPANSION_END) {
		return "Future RFC Expansion";
	}

	return "Unknown";
}
