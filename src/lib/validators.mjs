/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /src/lib/validators.mjs
 *	@Date: 2025-12-15T20:33:49-08:00 (1765859629)
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
 * Custom UUID Validators
 *
 * Validation functions for ensuring compliance with the custom UUID specification.
 * All validations reference specific bit positions and specification requirements.
 */

import {
	SUBVARIANT_TIMESTAMP,
	SUBVARIANT_ISSUER,
	ISSUER_CATEGORIES,
	ISSUER_ID_MASK,
	timestampLayout,
	issuerCategoryName
} from "./constants.mjs";
import { describeBytes, classify, RFC_FAMILY } from "./describe.mjs";
import { BitUtils } from "./bit-utils.mjs";
import { readStoredMagnitude, TIMESTAMP_MAX_MAGNITUDE } from "./timestamp.mjs";
import { toHex } from "@cldmv/uuid/bytes";

/**
 * Validator class for UUID specification compliance
 */
class UUIDValidator {
	/**
	 * Validate a UUID against the specification and describe it. `fields` has the same keys
	 * for every UUID, CLDMV or RFC: the {@link UUID#getInfo} fields (with `timestamp` as a
	 * bigint) plus the raw timestamp-variant bit fields, each null when it doesn't apply.
	 * @param {Uint8Array} uuidBuffer - 16-byte UUID buffer
	 * @returns {Object} Validation results
	 */
	static validateCompleteUUID(uuidBuffer) {
		if (!(uuidBuffer instanceof Uint8Array) || uuidBuffer.length !== 16) {
			throw new Error("UUID must be a 16-byte buffer");
		}

		const results = {
			isValid: true,
			isUUID: false,
			isCLDMV: false,
			errors: [],
			warnings: [],
			fields: {}
		};

		try {
			results.fields = {
				...describeBytes(uuidBuffer),
				timestampLayout: null,
				timestampSign: null,
				timestampSegmentA: null,
				timestampContinuation: null,
				timestampMagnitude: null,
				isImmutableReserved: false
			};
			results.isUUID = results.fields.isUUID;
			results.isCLDMV = results.fields.isCLDMV;

			if (results.isCLDMV) {
				UUIDValidator._validateUUIDFields(uuidBuffer, results);
			}
		} catch (error) {
			results.isValid = false;
			results.errors.push(`Validation error: ${error.message}`);
		}

		results.isValid = results.errors.length === 0;
		return results;
	}

	/**
	 * Check the CLDMV fields
	 * @param {Uint8Array} uuidBuffer - UUID buffer
	 * @param {Object} results - Results object to populate
	 * @private
	 */
	static _validateUUIDFields(uuidBuffer, results) {
		// Subvariant (bits 67-68) and version (bits 75-78), read again so their range is checked
		const subvariant = BitUtils.getBitsAsNumber(uuidBuffer, 67, 2);
		const validSubvariants = [SUBVARIANT_TIMESTAMP, SUBVARIANT_ISSUER, 0b10, 0b11];
		if (!validSubvariants.includes(subvariant)) {
			results.errors.push(`Invalid subvariant: ${subvariant}`);
		}

		const version = BitUtils.getBitsAsNumber(uuidBuffer, 75, 4);
		if (version < 0 || version > 15) {
			results.errors.push(`Invalid version: ${version} (must be 0-15)`);
		}

		if (subvariant === SUBVARIANT_ISSUER) {
			UUIDValidator._validateIssuerVariant(uuidBuffer, results);
		} else if (subvariant === SUBVARIANT_TIMESTAMP) {
			UUIDValidator._validateTimestampVariant(uuidBuffer, results, version);
		} else if (subvariant === 0b10 || subvariant === 0b11) {
			results.warnings.push(`Subvariant ${subvariant.toString(2).padStart(2, "0")} is reserved`);
		}
	}

	/**
	 * Check issuer-variant requirements
	 * @param {Uint8Array} uuidBuffer - UUID buffer
	 * @param {Object} results - Results object to populate
	 * @private
	 */
	static _validateIssuerVariant(uuidBuffer, results) {
		const issuerID = BitUtils.getBitsAsNumber(uuidBuffer, 79, 10);
		if (issuerID < 0 || issuerID > ISSUER_ID_MASK) {
			results.errors.push(`Invalid issuer ID: ${issuerID} (must be 0-${ISSUER_ID_MASK})`);
		}

		const immutableIDs = [ISSUER_CATEGORIES.UNASSIGNED, ISSUER_CATEGORIES.DRAFTER_RESERVED, ISSUER_CATEGORIES.SPEC_ORIGINATOR];
		results.fields.isImmutableReserved = immutableIDs.includes(issuerID);

		if (issuerID >= ISSUER_CATEGORIES.RFC_EXPANSION_START && issuerID <= ISSUER_CATEGORIES.RFC_EXPANSION_END) {
			results.warnings.push(`Issuer ID ${issuerID} is in future RFC expansion range`);
		}
	}

	/**
	 * Record the raw timestamp-variant bit fields
	 * @param {Uint8Array} uuidBuffer - UUID buffer
	 * @param {Object} results - Results object to populate
	 * @param {number} version - Bits 75-78
	 * @private
	 */
	static _validateTimestampVariant(uuidBuffer, results, version) {
		const layout = timestampLayout(version);
		results.fields.timestampLayout = layout;
		// Sign bit (bit 0): 1 = positive, 0 = negative
		results.fields.timestampSign = BitUtils.getBitsAsNumber(uuidBuffer, 0, 1);
		// Raw bits 1-63 (rest of segment A) and 69-74 (continuation), exactly as stored. Which
		// magnitude bits they hold depends on the layout: in "full" (versions 5, 6) bits 1-63
		// are the upper 63 magnitude bits and bits 69-74 the lowest 6.
		results.fields.timestampSegmentA = BitUtils.getBits(uuidBuffer, 1, 63);
		results.fields.timestampContinuation = BitUtils.getBitsAsNumber(uuidBuffer, 69, 6);
		// The 69-bit stored magnitude; negative timestamps store (2^69 - 1) - |t|
		const magnitude = readStoredMagnitude(uuidBuffer, layout);
		results.fields.timestampMagnitude = magnitude;
		results.fields.timestamp = results.fields.timestampSign === 0 ? magnitude - TIMESTAMP_MAX_MAGNITUDE : magnitude;
	}

	/**
	 * Read the bit fields. `bitFields` has the same keys for every UUID, each null when the
	 * UUID's variant doesn't define it; `version` is bits 75-78 for a CLDMV id and bits
	 * 48-51 for an RFC UUID.
	 * @param {Uint8Array} uuidBuffer - UUID buffer
	 * @returns {Object} Bit layout validation results
	 */
	static validateBitLayout(uuidBuffer) {
		const results = {
			isValid: true,
			errors: [],
			bitFields: {
				variant: null,
				subvariant: null,
				version: null,
				issuerID: null,
				timestampSign: null,
				timestampSegmentA: null,
				timestampContinuation: null
			}
		};
		const bits = results.bitFields;

		try {
			const { variant, family, isCLDMV, special } = classify(uuidBuffer);
			bits.variant = variant;

			if (isCLDMV) {
				const subvariant = BitUtils.getBitsAsNumber(uuidBuffer, 67, 2);
				const version = BitUtils.getBitsAsNumber(uuidBuffer, 75, 4);
				bits.subvariant = subvariant;
				bits.version = version;

				if (subvariant < 0 || subvariant > 3) {
					results.errors.push(`Subvariant ${subvariant} out of valid range (0-3)`);
				}
				if (version < 0 || version > 15) {
					results.errors.push(`Version ${version} out of valid range (0-15)`);
				}

				if (subvariant === SUBVARIANT_TIMESTAMP) {
					bits.timestampSign = BitUtils.getBitsAsNumber(uuidBuffer, 0, 1);
					bits.timestampSegmentA = BitUtils.getBits(uuidBuffer, 1, 63); // getBits for >32 bits
					bits.timestampContinuation = BitUtils.getBitsAsNumber(uuidBuffer, 69, 6);
				} else if (subvariant === SUBVARIANT_ISSUER) {
					const issuerID = BitUtils.getBitsAsNumber(uuidBuffer, 79, 10);
					bits.issuerID = issuerID;
					if (issuerID < 0 || issuerID > ISSUER_ID_MASK) {
						results.errors.push(`Issuer ID ${issuerID} out of valid range (0-${ISSUER_ID_MASK})`);
					}
				}
			} else if (family === RFC_FAMILY || special) {
				bits.version = BitUtils.getBitsAsNumber(uuidBuffer, 48, 4);
			}
		} catch (error) {
			results.isValid = false;
			results.errors.push(`Bit layout validation error: ${error.message}`);
		}

		results.isValid = results.errors.length === 0;
		return results;
	}

	/**
	 * The bit ranges that hold random data in a UUID, by variant:
	 * - Timestamp Variant: bits 79-127 (49 bits)
	 * - Issuer Variant: bits 0-63, 69-74 and 89-127 (109 bits), as this library fills them
	 * - RFC version 4: every bit except the version (48-51) and variant (64-65), 122 bits
	 * - RFC version 7: rand_a (52-63) and rand_b (66-127), 74 bits
	 * Other UUIDs (RFC versions 1, 3, 5, 6 and 8, Nil, Max, NCS, Microsoft, reserved
	 * subvariants) have no random field this library can identify.
	 * @param {Uint8Array} uuidBuffer - UUID buffer
	 * @returns {Array<{start: number, length: number}>|null} Bit ranges, or null when there is none
	 * @private
	 */
	static _entropyRanges(uuidBuffer) {
		const { family, isCLDMV, special } = classify(uuidBuffer);
		if (isCLDMV) {
			const subvariant = BitUtils.getBitsAsNumber(uuidBuffer, 67, 2);
			if (subvariant === SUBVARIANT_TIMESTAMP) {
				return [{ start: 79, length: 49 }];
			}
			if (subvariant === SUBVARIANT_ISSUER) {
				return [
					{ start: 0, length: 64 },
					{ start: 69, length: 6 },
					{ start: 89, length: 39 }
				];
			}
			return null;
		}
		if (family === RFC_FAMILY && !special) {
			const rfcVersion = BitUtils.getBitsAsNumber(uuidBuffer, 48, 4);
			if (rfcVersion === 4) {
				return [
					{ start: 0, length: 48 },
					{ start: 52, length: 12 },
					{ start: 66, length: 62 }
				];
			}
			if (rfcVersion === 7) {
				return [
					{ start: 52, length: 12 },
					{ start: 66, length: 62 }
				];
			}
		}
		return null;
	}

	/**
	 * Analyze the random bits of a UUID. The keys are the same for every UUID;
	 * `entropyBits` and `analysis.bitBalance` are null when it has no random field.
	 * @param {Uint8Array} uuidBuffer - UUID buffer
	 * @returns {Object} Entropy analysis results
	 */
	static validateEntropy(uuidBuffer) {
		const results = {
			isValid: true,
			entropyBits: null,
			warnings: [],
			analysis: { bitBalance: null }
		};

		const ranges = UUIDValidator._entropyRanges(uuidBuffer);
		if (!ranges) {
			return results;
		}

		let setBits = 0;
		let totalBits = 0;
		for (const range of ranges) {
			for (let bit = range.start; bit < range.start + range.length; bit++) {
				totalBits++;
				if ((uuidBuffer[bit >> 3] >> (7 - (bit & 7))) & 1) setBits++;
			}
		}
		results.entropyBits = totalBits;

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

		return results;
	}

	/**
	 * Get issuer category for an issuer ID
	 * @param {number} issuerID - Issuer ID
	 * @returns {string} Category name, the same one uuid.getIssuerCategory() returns
	 */
	static getIssuerCategory(issuerID) {
		return issuerCategoryName(issuerID);
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
	 * @param {Uint8Array} uuidBuffer - UUID buffer to validate
	 * @returns {Object} Comprehensive validation report
	 */
	static generateValidationReport(uuidBuffer) {
		if (!(uuidBuffer instanceof Uint8Array) || uuidBuffer.length !== 16) {
			throw new Error("UUID must be a 16-byte buffer");
		}
		const hex = toHex(uuidBuffer);
		const report = {
			timestamp: new Date(),
			uuid: hex,
			uuidString: `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`,
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
