/**
 * Custom UUID Implementation
 *
 * This module implements the custom UUID specification that extends RFC 4122
 * with new variant structures, subvariant branches, and issuer-based identification.
 *
 * Specification Compliance:
 * - variant = 111 (bits 64-66): Entry into custom namespace
 * - subvariant (bits 67-68): Defines variant type
 * - version (bits 75-78): Version identifier (4 bits)
 * - issuer ID (bits 79-88): 10-bit issuer identification (Issuer Variant only)
 */

import crypto from "crypto";
import { BitUtils } from "./lib/bit-utils.mjs";
import {
	VARIANT_BITS,
	SUBVARIANT_TIMESTAMP,
	SUBVARIANT_ISSUER,
	SUBVARIANT_RESERVED_10,
	SUBVARIANT_RESERVED_11,
	VERSION_START_BIT,
	VERSION_BIT_COUNT,
	ISSUER_ID_START_BIT,
	ISSUER_ID_BIT_COUNT,
	ISSUER_ID_MASK,
	ISSUER_CATEGORIES
} from "./lib/constants.mjs";
import * as rfcUuids from "./lib/rfc-uuids.mjs";

/**
 * UUID class implementing the new specification
 */
class UUID {
	/**
	 * Create a new UUID instance
	 * @param {Buffer|string|null} data - Optional UUID data to parse
	 */
	constructor(data = null) {
		this._buffer = Buffer.alloc(16);

		if (data !== null && data !== undefined) {
			this._parseFromData(data);
		}
	}

	/**
	 * Parse UUID from existing data
	 * @param {Buffer|string} data - UUID data to parse
	 * @private
	 */
	_parseFromData(data) {
		if (typeof data === "string") {
			// Remove dashes and convert hex string to buffer
			const hex = data.replace(/-/g, "");
			if (hex.length !== 32) {
				throw new Error("Invalid UUID string length");
			}
			this._buffer = Buffer.from(hex, "hex");
		} else if (Buffer.isBuffer(data)) {
			if (data.length !== 16) {
				throw new Error("Invalid UUID buffer length");
			}
			this._buffer = Buffer.from(data);
		} else {
			throw new Error("Invalid UUID data type");
		}
	}

	/**
	 * Create a new Issuer Variant UUID
	 * @param {number} issuerID - Issuer ID (0-ISSUER_ID_MASK)
	 * @param {number} version - Version number
	 * @param {Buffer} entropy - Additional entropy data
	 * @returns {UUID} New UUID instance
	 */
	static createIssuerVariant(issuerID, version, entropy = null) {
		const uuid = new UUID();

		// Validate issuer ID
		if (!Number.isInteger(issuerID) || issuerID < 0 || issuerID > ISSUER_ID_MASK) {
			throw new Error(`Invalid issuer ID: ${issuerID}. Must be 0-${ISSUER_ID_MASK}.`);
		}

		// Set variant (bits 64-66) = 111
		uuid._setVariant(VARIANT_BITS);

		// Set subvariant (bits 67-68) = 01 (Issuer Variant)
		uuid._setSubvariant(SUBVARIANT_ISSUER);

		// Set version (bits 75-78)
		uuid._setVersion(version);

		// Set issuer ID (bits 78-87)
		uuid._setIssuerID(issuerID);

		// Fill remaining bits with entropy
		if (!entropy) {
			entropy = crypto.randomBytes(16);
		}
		uuid._fillEntropy(entropy);

		return uuid;
	}

	/**
	 * Create a new Timestamp Variant UUID
	 * @param {number|Date} timestamp - Timestamp value (optional, defaults to Date.now())
	 * @param {number} version - Version number
	 * @param {Buffer} entropy - Optional entropy for bits 79-127
	 * @returns {UUID} New UUID instance
	 */
	static createTimestampVariant(timestamp, version, entropy = null) {
		const uuid = new UUID();

		// Use current time if timestamp not provided
		// Version 1: seconds, Version 2: milliseconds
		if (timestamp === undefined || timestamp === null) {
			if (version === 1) {
				timestamp = Math.floor(Date.now() / 1000); // seconds
			} else {
				timestamp = Date.now(); // milliseconds
			}
		}

		// Convert Date objects to appropriate timestamp value
		let timestampValue;
		if (timestamp instanceof Date) {
			if (version === 1) {
				timestampValue = Math.floor(timestamp.getTime() / 1000); // seconds
			} else {
				timestampValue = timestamp.getTime(); // milliseconds
			}
		} else {
			// Use the timestamp as provided by user in the correct unit
			timestampValue = timestamp;
		}

		// Set variant (bits 64-66) = 111
		uuid._setVariant(VARIANT_BITS);

		// Set subvariant (bits 67-68) = 00 (Timestamp Variant)
		uuid._setSubvariant(SUBVARIANT_TIMESTAMP);

		// Set version (bits 75-78)
		uuid._setVersion(version);

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
			uuid._buffer[i] = entropy[i];
		}

		// Restore immutable fields that might have been overwritten by entropy
		uuid._setVariant(VARIANT_BITS);
		uuid._setSubvariant(SUBVARIANT_TIMESTAMP);
		uuid._setVersion(version);

		// Set timestamp AFTER entropy to ensure timestamp bits are not overwritten
		// Timestamp occupies bits 0-63 and 69-74 (70 bits total: 1 sign + 69 magnitude)
		uuid._setTimestamp(timestampValue);

		return uuid;
	}

	/**
	 * Create an issuer-based UUID (short name alias)
	 * @param {number} issuerID - Issuer ID (0-1023)
	 * @param {number} version - Version number
	 * @param {Buffer} entropy - Additional entropy data
	 * @returns {UUID} New UUID instance
	 */
	static issuer(issuerID, version, entropy = null) {
		return UUID.createIssuerVariant(issuerID, version, entropy);
	}

	/**
	 * Create a timestamp-based UUID (short name alias)
	 * @param {number|Date} timestamp - Timestamp value (optional, defaults to Date.now())
	 * @param {number} version - Version number
	 * @param {Buffer} entropy - Optional entropy for bits 79-127
	 * @returns {UUID} New UUID instance
	 */
	static timestamp(timestamp, version, entropy = null) {
		return UUID.createTimestampVariant(timestamp, version, entropy);
	}

	/**
	 * Create Timestamp Variant v1 UUID (ultra-short alias)
	 * Subvariant 00 - Timestamp-based identification (seconds precision)
	 * @param {number|Date} timestamp - Timestamp value (optional, defaults to Date.now())
	 * @param {Buffer} entropy - Optional entropy for bits 79-127
	 * @returns {UUID} New UUID instance
	 */
	static TA(timestamp, entropy = null) {
		return UUID.createTimestampVariant(timestamp, 1, entropy);
	}

	/**
	 * Create Issuer Variant v1 UUID (ultra-short alias)
	 * Subvariant 01 - Issuer-based identification
	 * @param {number} issuerID - Issuer ID (0-1023)
	 * @param {Buffer} entropy - Additional entropy data
	 * @returns {UUID} New UUID instance
	 */
	static IA(issuerID, entropy = null) {
		return UUID.createIssuerVariant(issuerID, 1, entropy);
	}

	/**
	 * Create Timestamp Variant v2 UUID (ultra-short alias)
	 * Subvariant 00 - Timestamp-based identification (milliseconds precision)
	 * @param {number|Date} timestamp - Timestamp value (optional, defaults to Date.now())
	 * @param {Buffer} entropy - Optional entropy for bits 79-127
	 * @returns {UUID} New UUID instance
	 */
	static TB(timestamp, entropy = null) {
		return UUID.createTimestampVariant(timestamp, 2, entropy);
	}

	/**
	 * Set 70-bit timestamp according to specification
	 * @param {number} timestampValue - Timestamp value (in seconds for v1, milliseconds for v2)
	 * @private
	 */
	_setTimestamp(timestampValue) {
		// Handle sign bit (bit 0)
		const isNegative = timestampValue < 0;
		const absTimestamp = Math.abs(timestampValue);

		// Set sign bit: 0 = negative, 1 = positive
		BitUtils.setBits(this._buffer, 0, 1, isNegative ? 0 : 1);

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
		BitUtils.setBits(this._buffer, 1, 32, lower32);

		// Set middle 31 bits (bits 33-63)
		const middle31 = Number((storedMagnitude >> BigInt(32)) & BigInt(0x7fffffff));
		BitUtils.setBits(this._buffer, 33, 31, middle31);

		// Set upper 6 bits (bits 69-74)
		const upper6 = Number((storedMagnitude >> BigInt(63)) & BigInt(0x3f));
		BitUtils.setBits(this._buffer, 69, 6, upper6);
	}

	/**
	 * Fill remaining bits with entropy while preserving immutable fields
	 * @param {Buffer} entropy - Entropy data
	 * @private
	 */
	_fillEntropy(entropy) {
		// Save immutable field values before filling entropy
		const variant = this.getVariant();
		const subvariant = this.getSubvariant();
		const version = this.getVersion();
		const issuerID = this.getIssuerID();

		// Apply entropy to entire buffer
		entropy.copy(this._buffer);

		// Restore immutable fields with saved values
		this._setVariant(variant);
		this._setSubvariant(subvariant);
		this._setVersion(version);
		this._setIssuerID(issuerID);
	}

	/**
	 * Set the variant field (internal method)
	 * @param {number} variant - Variant value
	 * @private
	 */
	_setVariant(variant) {
		BitUtils.setBits(this._buffer, 64, 3, variant);
	}

	/**
	 * Set the subvariant field (internal method)
	 * @param {number} subvariant - Subvariant value
	 * @private
	 */
	_setSubvariant(subvariant) {
		BitUtils.setBits(this._buffer, 67, 2, subvariant);
	}

	/**
	 * Set the version field (internal method)
	 * @param {number} version - Version value
	 * @private
	 */
	_setVersion(version) {
		BitUtils.setBits(this._buffer, VERSION_START_BIT, VERSION_BIT_COUNT, version);
	}

	/**
	 * Set the issuer ID field (internal method)
	 * @param {number} issuerID - Issuer ID value
	 * @private
	 */
	_setIssuerID(issuerID) {
		BitUtils.setBits(this._buffer, ISSUER_ID_START_BIT, ISSUER_ID_BIT_COUNT, issuerID);
	}

	/**
	 * Get the variant field
	 * @returns {number} Variant value (should be 7 for these UUIDs)
	 */
	getVariant() {
		return BitUtils.getBitsAsNumber(this._buffer, 64, 3);
	}

	/**
	 * Get the subvariant field
	 * @returns {number} Subvariant value
	 */
	getSubvariant() {
		return BitUtils.getBitsAsNumber(this._buffer, 67, 2);
	}

	/**
	 * Get the version field
	 * @returns {number} Version value
	 */
	getVersion() {
		return BitUtils.getBitsAsNumber(this._buffer, VERSION_START_BIT, VERSION_BIT_COUNT);
	}

	/**
	 * Get the issuer ID field
	 * @returns {number|null} Issuer ID (0-ISSUER_ID_MASK) for Issuer Variant, null for Timestamp Variant
	 */
	getIssuerID() {
		// Issuer ID only exists in Issuer Variant (subvariant 01)
		// For Timestamp Variant (subvariant 00), bits 79-88 are entropy, not issuer ID
		if (this.isTimestampVariant()) {
			return null;
		}
		return BitUtils.getBitsAsNumber(this._buffer, ISSUER_ID_START_BIT, ISSUER_ID_BIT_COUNT);
	}

	/**
	 * Check if this UUID is a valid UUID (variant = 111)
	 * @returns {boolean} True if valid UUID
	 */
	isUUID() {
		return this.getVariant() === VARIANT_BITS;
	}

	/**
	 * Check if this is an Issuer Variant UUID
	 * @returns {boolean} True if issuer variant
	 */
	isIssuerVariant() {
		return this.isUUID() && this.getSubvariant() === SUBVARIANT_ISSUER;
	}

	/**
	 * Check if this is a Timestamp Variant UUID
	 * @returns {boolean} True if timestamp variant
	 */
	isTimestampVariant() {
		return this.isUUID() && this.getSubvariant() === SUBVARIANT_TIMESTAMP;
	}

	/**
	 * Get issuer category based on issuer ID
	 * @returns {string|null} Issuer category name, or null if not an Issuer Variant
	 */
	getIssuerCategory() {
		const issuerID = this.getIssuerID();

		// Timestamp variants don't have issuer IDs
		if (issuerID === null) {
			return null;
		}

		if (issuerID === ISSUER_CATEGORIES.UNASSIGNED) return "Unassigned";
		if (issuerID === ISSUER_CATEGORIES.DRAFTER_RESERVED) return "Drafter Reserved";
		if (issuerID === ISSUER_CATEGORIES.SPEC_ORIGINATOR) return "Spec Originator";
		if (issuerID >= ISSUER_CATEGORIES.CATEGORY_A_START && issuerID <= ISSUER_CATEGORIES.CATEGORY_A_END) {
			return "Category A (Well-Recognized Tech Entities)";
		}
		if (issuerID >= ISSUER_CATEGORIES.CATEGORY_B_START && issuerID <= ISSUER_CATEGORIES.CATEGORY_B_END) {
			return "Category B (Open Source Contributors)";
		}
		if (issuerID >= ISSUER_CATEGORIES.RFC_EXPANSION_START && issuerID <= ISSUER_CATEGORIES.RFC_EXPANSION_END) {
			return "Future RFC Expansion";
		}

		return "Unknown";
	}

	/**
	 * Get the timestamp value from a Timestamp Variant UUID
	 * @returns {number|null} Timestamp value in the stored precision (seconds for v1, milliseconds for v2+), or null if not a Timestamp Variant
	 */
	getTimestamp() {
		// Timestamp only exists in Timestamp Variant (subvariant 00)
		if (!this.isTimestampVariant()) {
			return null;
		}

		// Extract sign bit (bit 0)
		const signBit = BitUtils.getBitsAsNumber(this._buffer, 0, 1);
		const isPositive = signBit === 1;

		// Extract timestamp magnitude from the 69 bits
		// Bits 1-63 (63 bits), bits 69-74 (6 bits) = 69 bits total

		// Get lower 32 bits (bits 1-32)
		const lower32 = BigInt(BitUtils.getBitsAsNumber(this._buffer, 1, 32));

		// Get middle 31 bits (bits 33-63)
		const middle31 = BigInt(BitUtils.getBitsAsNumber(this._buffer, 33, 31));

		// Get upper 6 bits (bits 69-74)
		const upper6 = BigInt(BitUtils.getBitsAsNumber(this._buffer, 69, 6));

		// Reconstruct the stored 69-bit magnitude: lower32 | (middle31 << 32) | (upper6 << 63)
		const storedMagnitude = lower32 | (middle31 << BigInt(32)) | (upper6 << BigInt(63));

		// Apply negative timestamp ordering rule
		// If sign bit = 0 (negative): stored = (2^69 - 1) - abs(magnitude)
		// Therefore: abs(magnitude) = (2^69 - 1) - stored
		// And: timestamp = -abs(magnitude)
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

	/**
	 * Convert UUID to string representation
	 * @returns {string} UUID string with dashes
	 */
	toString() {
		const hex = this._buffer.toString("hex");
		return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
	}

	/**
	 * Convert UUID to buffer
	 * @returns {Buffer} UUID as 16-byte buffer
	 */
	toBuffer() {
		return Buffer.from(this._buffer);
	}

	/**
	 * Get detailed information about this UUID
	 * @returns {object} UUID information object
	 */
	getInfo() {
		return {
			uuid: this.toString(),
			isUUID: this.isUUID(),
			variant: this.getVariant(),
			subvariant: this.getSubvariant(),
			version: this.getVersion(),
			issuerID: this.getIssuerID(),
			issuerCategory: this.getIssuerCategory(),
			timestamp: this.getTimestamp(),
			isIssuerVariant: this.isIssuerVariant(),
			isTimestampVariant: this.isTimestampVariant()
		};
	}

	// ==================== Static Registry & Validation Methods ====================

	/**
	 * Get the shared issuer registry instance
	 * @returns {Promise<IssuerRegistry>} Shared registry instance
	 */
	static async getRegistry() {
		if (!UUID._registryInstance) {
			const { IssuerRegistry } = await import("./lib/issuer-registry.mjs");
			UUID._registryInstance = new IssuerRegistry();
		}
		return UUID._registryInstance;
	}

	/**
	 * Register a new issuer in Category A
	 * @param {number} issuerID - Issuer ID (2-255)
	 * @param {string} name - Organization name
	 * @param {string} description - Description
	 * @returns {Promise<boolean>} True if successful
	 */
	static async registerIssuerA(issuerID, name, description) {
		const registry = await UUID.getRegistry();
		return registry.registerCategoryA(issuerID, name, description);
	}

	/**
	 * Register a new issuer in Category B
	 * @param {number} issuerID - Issuer ID (256-511)
	 * @param {string} name - Organization/Project name
	 * @param {string} description - Description
	 * @returns {Promise<boolean>} True if successful
	 */
	static async registerIssuerB(issuerID, name, description) {
		const registry = await UUID.getRegistry();
		return registry.registerCategoryB(issuerID, name, description);
	}

	/**
	 * Get issuer information by ID
	 * @param {number} issuerID - Issuer ID to lookup
	 * @returns {Promise<object|null>} Issuer information or null
	 */
	static async getIssuerInfo(issuerID) {
		const registry = await UUID.getRegistry();
		return registry.getIssuer(issuerID);
	}

	/**
	 * Validate a UUID buffer for specification compliance
	 * @param {Buffer} buffer - UUID buffer to validate
	 * @returns {Promise<object>} Validation results
	 */
	static async validate(buffer) {
		const { UUIDValidator } = await import("./lib/validators.mjs");
		return UUIDValidator.validateCompleteUUID(buffer);
	}

	/**
	 * Generate a complete validation report for a UUID
	 * @param {Buffer} buffer - UUID buffer to validate
	 * @returns {Promise<object>} Detailed validation report
	 */
	static async validateDetailed(buffer) {
		const { UUIDValidator } = await import("./lib/validators.mjs");
		return UUIDValidator.generateValidationReport(buffer);
	}

	// RFC 4122 / RFC 9562 Standard UUID Methods
	// Delegates to lib/rfc-uuids.mjs

	/**
	 * Generate a version 1 (timestamp) UUID
	 * @param {Object} options - Optional parameters
	 * @returns {string} UUID string
	 */
	static v1(options) {
		return rfcUuids.v1(options);
	}

	/**
	 * Generate a version 3 (namespace with MD5) UUID
	 * @param {string} name - Name to hash
	 * @param {string|Uint8Array} namespace - Namespace UUID
	 * @returns {string} UUID string
	 */
	static v3(name, namespace) {
		return rfcUuids.v3(name, namespace);
	}

	/**
	 * Generate a version 4 (random) UUID
	 * @param {Object} options - Optional parameters
	 * @returns {string} UUID string
	 */
	static v4(options) {
		return rfcUuids.v4(options);
	}

	/**
	 * Generate a version 5 (namespace with SHA-1) UUID
	 * @param {string} name - Name to hash
	 * @param {string|Uint8Array} namespace - Namespace UUID
	 * @returns {string} UUID string
	 */
	static v5(name, namespace) {
		return rfcUuids.v5(name, namespace);
	}

	/**
	 * Generate a version 6 (timestamp, reordered) UUID
	 * @param {Object} options - Optional parameters
	 * @returns {string} UUID string
	 */
	static v6(options) {
		return rfcUuids.v6(options);
	}

	/**
	 * Generate a version 7 (Unix Epoch) UUID
	 * @param {Object} options - Optional parameters
	 * @returns {string} UUID string
	 */
	static v7(options) {
		return rfcUuids.v7(options);
	}

	/**
	 * Convert UUID string to byte array
	 * @param {string} uuid - UUID string
	 * @returns {Uint8Array} 16-byte array
	 */
	static parse(uuid) {
		return rfcUuids.parse(uuid);
	}

	/**
	 * Convert byte array to UUID string
	 * @param {Uint8Array|Buffer|Array} bytes - 16-byte array
	 * @returns {string} UUID string
	 */
	static stringify(bytes) {
		return rfcUuids.stringify(bytes);
	}

	/**
	 * Validate UUID string format
	 * @param {string} uuid - UUID string to validate
	 * @returns {boolean} True if valid
	 */
	static validateRFC(uuid) {
		return rfcUuids.validate(uuid);
	}

	/**
	 * Detect RFC version of UUID
	 * @param {string} uuid - UUID string
	 * @returns {number|null} Version number or null
	 */
	static version(uuid) {
		return rfcUuids.version(uuid);
	}
}

// RFC UUID constants
UUID.NIL = rfcUuids.NIL;
UUID.MAX = rfcUuids.MAX;

// Standard namespaces for v3/v5
UUID.DNS = rfcUuids.DNS;
UUID.URL = rfcUuids.URL;
UUID.OID = rfcUuids.OID;
UUID.X500 = rfcUuids.X500;

// Export both uppercase and lowercase for convenience
export { UUID, UUID as uuid, ISSUER_CATEGORIES };
