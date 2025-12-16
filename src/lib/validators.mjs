/**
 * Custom UUID Validators
 *
 * Validation functions for ensuring compliance with the custom UUID specification.
 * All validations reference specific bit positions and specification requirements.
 */

import { VARIANT_BITS, SUBVARIANT_TIMESTAMP, SUBVARIANT_ISSUER, ISSUER_CATEGORIES, ISSUER_ID_MASK } from "./constants.mjs";
import { BitUtils } from "./bit-utils.mjs";

/**
 * Validator class for UUID specification compliance
 */
class UUIDValidator {
	/**
	 * Validate complete UUID compliance with custom specification
	 * @param {Buffer} uuidBuffer - 16-byte UUID buffer
	 * @returns {Object} Validation results
	 */
	static validateCompleteUUID(uuidBuffer) {
		if (!Buffer.isBuffer(uuidBuffer) || uuidBuffer.length !== 16) {
			throw new Error("UUID must be a 16-byte buffer");
		}

		const results = {
			isValid: true,
			isUUID: false,
			errors: [],
			warnings: [],
			fields: {}
		};

		try {
			// Extract and validate variant (bits 64-66)
			const variant = BitUtils.getBitsAsNumber(uuidBuffer, 64, 3);
			results.fields.variant = variant;

			if (variant === VARIANT_BITS) {
				results.isUUID = true;
				UUIDValidator._validateUUIDFields(uuidBuffer, results);
			} else {
				results.warnings.push(`Not a valid UUID (variant=${variant}, expected=${VARIANT_BITS})`);
			}
		} catch (error) {
			results.isValid = false;
			results.errors.push(`Validation error: ${error.message}`);
		}

		results.isValid = results.errors.length === 0;
		return results;
	}

	/**
	 * Validate UUID specific fields
	 * @param {Buffer} uuidBuffer - UUID buffer
	 * @param {Object} results - Results object to populate
	 * @private
	 */
	static _validateUUIDFields(uuidBuffer, results) {
		// Validate subvariant (bits 67-68)
		const subvariant = BitUtils.getBitsAsNumber(uuidBuffer, 67, 2);
		results.fields.subvariant = subvariant;

		const validSubvariants = [SUBVARIANT_TIMESTAMP, SUBVARIANT_ISSUER, 0b10, 0b11];
		if (!validSubvariants.includes(subvariant)) {
			results.errors.push(`Invalid subvariant: ${subvariant}`);
		}

		// Validate version (bits 75-78)
		const version = BitUtils.getBitsAsNumber(uuidBuffer, 75, 4);
		results.fields.version = version;

		if (version < 0 || version > 15) {
			results.errors.push(`Invalid version: ${version} (must be 0-15)`);
		}

		// Validate issuer ID (bits 79-88) - only for Issuer Variant
		if (subvariant === SUBVARIANT_ISSUER) {
			const issuerID = BitUtils.getBitsAsNumber(uuidBuffer, 79, 10);
			results.fields.issuerID = issuerID;

			if (issuerID < 0 || issuerID > ISSUER_ID_MASK) {
				results.errors.push(`Invalid issuer ID: ${issuerID} (must be 0-${ISSUER_ID_MASK})`);
			}
		}

		// Subvariant-specific validation
		if (subvariant === SUBVARIANT_ISSUER) {
			UUIDValidator._validateIssuerVariant(uuidBuffer, results);
		} else if (subvariant === SUBVARIANT_TIMESTAMP) {
			UUIDValidator._validateTimestampVariant(uuidBuffer, results);
		} else if (subvariant === 0b10 || subvariant === 0b11) {
			results.warnings.push(`Subvariant ${subvariant.toString(2).padStart(2, "0")} is reserved`);
		}
	}

	/**
	 * Validate issuer variant specific requirements
	 * @param {Buffer} uuidBuffer - UUID buffer
	 * @param {Object} results - Results object to populate
	 * @private
	 */
	static _validateIssuerVariant(uuidBuffer, results) {
		const issuerID = results.fields.issuerID;

		// Validate issuer ID category
		const category = UUIDValidator.getIssuerCategory(issuerID);
		results.fields.issuerCategory = category;

		// Check for immutable reserved IDs
		const immutableIDs = [ISSUER_CATEGORIES.UNASSIGNED, ISSUER_CATEGORIES.DRAFTER_RESERVED, ISSUER_CATEGORIES.SPEC_ORIGINATOR];

		if (immutableIDs.includes(issuerID)) {
			results.fields.isImmutableReserved = true;
		}

		// Validate category ranges
		if (issuerID >= ISSUER_CATEGORIES.CATEGORY_A_START && issuerID <= ISSUER_CATEGORIES.CATEGORY_A_END) {
			results.fields.categoryValidation = "Category A (Well-Recognized Tech Entities)";
		} else if (issuerID >= ISSUER_CATEGORIES.CATEGORY_B_START && issuerID <= ISSUER_CATEGORIES.CATEGORY_B_END) {
			results.fields.categoryValidation = "Category B (Open Source Contributors)";
		} else if (issuerID >= ISSUER_CATEGORIES.FUTURE_RFC_START && issuerID <= ISSUER_CATEGORIES.FUTURE_RFC_END) {
			results.fields.categoryValidation = "Future RFC Expansion";
			results.warnings.push(`Issuer ID ${issuerID} is in future RFC expansion range`);
		}
	}

	/**
	 * Validate timestamp variant specific requirements
	 * @param {Buffer} uuidBuffer - UUID buffer
	 * @param {Object} results - Results object to populate
	 * @private
	 */
	static _validateTimestampVariant(uuidBuffer, results) {
		// Validate 70-bit signed timestamp layout per spec

		// Check sign bit (bit 0)
		const signBit = BitUtils.getBitsAsNumber(uuidBuffer, 0, 1);
		results.fields.timestampSign = signBit;

		// Extract lower 63 bits (bits 1-63)
		const lower63 = BitUtils.getBits(uuidBuffer, 1, 63);
		results.fields.timestampLower63 = lower63;

		// Extract timestamp continuation bits (bits 69-74)
		const timestampContinuation = BitUtils.getBitsAsNumber(uuidBuffer, 69, 6);
		results.fields.timestampContinuation = timestampContinuation;

		// Extract reserved bit 69 for validation
		const reservedBit69 = BitUtils.getBitsAsNumber(uuidBuffer, 69, 1);
		results.fields.reservedBit69 = reservedBit69;

		// Check if reserved bits are being used
		if (reservedBit69 !== 0) {
			results.warnings.push(`Reserved bit 69 is set to ${reservedBit69} (should be 0)`);
		}

		// Reconstruct 70-bit timestamp (69 bits magnitude + 1 sign bit)
		// Bits 1-63 (63 bits) + bits 69-74 (6 bits) = 69 bits magnitude
		const magnitude = (BigInt(timestampContinuation) << 63n) | lower63;
		results.fields.timestampMagnitude = magnitude;

		// Apply negative ordering rule if negative
		let actualTimestamp;
		if (signBit === 0) {
			// Negative: stored = (2^69 - 1) - abs(magnitude)
			// So: abs(magnitude) = (2^69 - 1) - stored
			const maxMagnitude = (1n << 69n) - 1n;
			actualTimestamp = -(maxMagnitude - magnitude);
		} else {
			// Positive: magnitude stored normally
			actualTimestamp = magnitude;
		}
		results.fields.actualTimestamp = actualTimestamp;

		// Note: Bits 64-68 contain variant (64-66) and subvariant (67-68)
		// These overlap with what would be timestamp bits in a pure 70-bit layout
		// This is expected per the specification
	}

	/**
	 * Validate bit layout compliance
	 * @param {Buffer} uuidBuffer - UUID buffer
	 * @returns {Object} Bit layout validation results
	 */
	static validateBitLayout(uuidBuffer) {
		const results = {
			isValid: true,
			errors: [],
			bitFields: {}
		};

		try {
			// Extract bit fields manually to handle large values
			results.bitFields.timestampSign = BitUtils.getBitsAsNumber(uuidBuffer, 0, 1);
			results.bitFields.timestampLower63 = BitUtils.getBits(uuidBuffer, 1, 63); // Use getBits for >32 bits
			results.bitFields.variant = BitUtils.getBitsAsNumber(uuidBuffer, 64, 3);
			results.bitFields.subvariant = BitUtils.getBitsAsNumber(uuidBuffer, 67, 2);
			results.bitFields.timestampContinuation = BitUtils.getBitsAsNumber(uuidBuffer, 69, 6);
			results.bitFields.version = BitUtils.getBitsAsNumber(uuidBuffer, 75, 4);
			results.bitFields.issuerID = BitUtils.getBitsAsNumber(uuidBuffer, 79, 10);

			// Validate that immutable field positions are consistent
			const variant = results.bitFields.variant;
			const subvariant = results.bitFields.subvariant;
			const version = results.bitFields.version;
			const issuerID = results.bitFields.issuerID;

			// Check immutable field constraints
			if (variant === VARIANT_BITS) {
				// This is a custom UUID, validate immutable fields
				if (subvariant < 0 || subvariant > 3) {
					results.errors.push(`Subvariant ${subvariant} out of valid range (0-3)`);
				}

				if (version < 0 || version > 15) {
					results.errors.push(`Version ${version} out of valid range (0-15)`);
				}

				// Only validate issuer ID for Issuer Variant (subvariant = 01)
				if (subvariant === SUBVARIANT_ISSUER) {
					if (issuerID < 0 || issuerID > ISSUER_ID_MASK) {
						results.errors.push(`Issuer ID ${issuerID} out of valid range (0-${ISSUER_ID_MASK})`);
					}
				}
			}
		} catch (error) {
			results.isValid = false;
			results.errors.push(`Bit layout validation error: ${error.message}`);
		}

		results.isValid = results.errors.length === 0;
		return results;
	}

	/**
	 * Validate entropy distribution in non-immutable fields
	 * @param {Buffer} uuidBuffer - UUID buffer
	 * @returns {Object} Entropy validation results
	 */
	static validateEntropy(uuidBuffer) {
		const results = {
			isValid: true,
			entropyBits: 0,
			warnings: [],
			analysis: {}
		};

		// Create mask for immutable fields
		const immutableMask = Buffer.alloc(16, 0);

		// Mark immutable bits (these should not contribute to entropy analysis)
		const immutableFields = [
			{ start: 64, length: 3 }, // variant
			{ start: 67, length: 2 }, // subvariant
			{ start: 75, length: 4 }, // version
			{ start: 79, length: 10 } // issuer ID (bits 79-88)
		];

		for (const field of immutableFields) {
			for (let i = 0; i < field.length; i++) {
				const bitPos = field.start + i;
				const byteIndex = Math.floor(bitPos / 8);
				const bitInByte = 7 - (bitPos % 8);
				immutableMask[byteIndex] |= 1 << bitInByte;
			}
		}

		// Extract entropy bits (non-immutable bits)
		const entropyBuffer = Buffer.from(uuidBuffer);
		for (let i = 0; i < 16; i++) {
			entropyBuffer[i] &= ~immutableMask[i]; // Clear immutable bits
		}

		// Count available entropy bits
		let availableEntropyBits = 128; // Total bits
		for (const field of immutableFields) {
			availableEntropyBits -= field.length;
		}

		results.entropyBits = availableEntropyBits;

		// Analyze entropy quality in remaining bits
		let setBits = 0;
		let totalBits = 0;

		for (let i = 0; i < 16; i++) {
			for (let bit = 0; bit < 8; bit++) {
				const bitPos = i * 8 + bit;
				const isImmutable = (immutableMask[i] >> (7 - bit)) & 1;

				if (!isImmutable) {
					totalBits++;
					const bitValue = (uuidBuffer[i] >> (7 - bit)) & 1;
					if (bitValue) setBits++;
				}
			}
		}

		if (totalBits > 0) {
			const balance = setBits / totalBits;
			results.analysis.bitBalance = balance;

			// Check for poor entropy (too many 0s or 1s)
			if (balance < 0.3 || balance > 0.7) {
				results.warnings.push(`Poor bit balance in entropy fields: ${(balance * 100).toFixed(1)}%`);
			}

			// Check for all zeros or all ones in entropy fields
			if (setBits === 0) {
				results.warnings.push("All entropy bits are zero");
			} else if (setBits === totalBits) {
				results.warnings.push("All entropy bits are one");
			}
		}

		return results;
	}

	/**
	 * Get issuer category name from issuer ID
	 * @param {number} issuerID - Issuer ID
	 * @returns {string} Category name
	 */
	static getIssuerCategory(issuerID) {
		if (issuerID === ISSUER_CATEGORIES.UNASSIGNED) return "Unassigned";
		if (issuerID === ISSUER_CATEGORIES.DRAFTER_RESERVED) return "Drafter Reserved";
		if (issuerID === ISSUER_CATEGORIES.SPEC_ORIGINATOR) return "Spec Originator";
		if (issuerID >= ISSUER_CATEGORIES.CATEGORY_A_START && issuerID <= ISSUER_CATEGORIES.CATEGORY_A_END) {
			return "Category A";
		}
		if (issuerID >= ISSUER_CATEGORIES.CATEGORY_B_START && issuerID <= ISSUER_CATEGORIES.CATEGORY_B_END) {
			return "Category B";
		}
		if (issuerID >= ISSUER_CATEGORIES.RFC_EXPANSION_START && issuerID <= ISSUER_CATEGORIES.RFC_EXPANSION_END) {
			return "Future RFC";
		}
		return "Unknown";
	}

	/**
	 * Validate issuer ID is not in an immutable reserved range
	 * @param {number} issuerID - Issuer ID to validate
	 * @returns {Object} Validation result
	 */
	static validateIssuerIDMutability(issuerID) {
		const immutableIDs = [ISSUER_CATEGORIES.UNASSIGNED, ISSUER_CATEGORIES.DRAFTER_RESERVED, ISSUER_CATEGORIES.SPEC_ORIGINATOR];

		return {
			isValid: !immutableIDs.includes(issuerID),
			isImmutable: immutableIDs.includes(issuerID),
			category: UUIDValidator.getIssuerCategory(issuerID),
			message: immutableIDs.includes(issuerID)
				? `Issuer ID ${issuerID} is immutable and cannot be modified`
				: `Issuer ID ${issuerID} is mutable`
		};
	}

	/**
	 * Generate a comprehensive validation report
	 * @param {Buffer} uuidBuffer - UUID buffer to validate
	 * @returns {Object} Comprehensive validation report
	 */
	static generateValidationReport(uuidBuffer) {
		const report = {
			timestamp: new Date(),
			uuid: uuidBuffer.toString("hex"),
			uuidString: `${uuidBuffer.toString("hex").slice(0, 8)}-${uuidBuffer.toString("hex").slice(8, 12)}-${uuidBuffer
				.toString("hex")
				.slice(12, 16)}-${uuidBuffer.toString("hex").slice(16, 20)}-${uuidBuffer.toString("hex").slice(20, 32)}`,
			overallValid: true,
			sections: {}
		};

		// Run all validation sections
		report.sections.complete = UUIDValidator.validateCompleteUUID(uuidBuffer);
		report.sections.bitLayout = UUIDValidator.validateBitLayout(uuidBuffer);
		report.sections.entropy = UUIDValidator.validateEntropy(uuidBuffer);

		// Determine overall validity
		report.overallValid = Object.values(report.sections).every((section) => section.isValid);

		// Collect all errors and warnings
		report.allErrors = [];
		report.allWarnings = [];

		for (const section of Object.values(report.sections)) {
			if (section.errors) report.allErrors.push(...section.errors);
			if (section.warnings) report.allWarnings.push(...section.warnings);
		}

		return report;
	}
}

export { UUIDValidator };
