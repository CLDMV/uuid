/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /src/uuid.mjs
 *	@Date: 2025-12-15T20:33:49-08:00 (1765859629)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-02T21:25:22-08:00 (1793683522)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

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

import { randomBytes } from "@cldmv/uuid/rng";
import { toHex, fromHex, toBufferLike } from "@cldmv/uuid/bytes";
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
	ISSUER_CATEGORIES,
	isSecondsVersion,
	isOrderedVersion
} from "./lib/constants.mjs";
import * as rfcUuids from "./lib/versions/rfc/index.mjs";

/**
 * The byte container toBuffer() returns: a Buffer in Node, a plain Uint8Array elsewhere.
 * `#bytes-type` (package.json `imports`) resolves to a Buffer alias under the `node`
 * condition and to a Uint8Array alias otherwise.
 * @typedef {import("#bytes-type").Bytes} Bytes
 */

/**
 * Options shared by the RFC generators that can write into a caller-supplied buffer.
 * @typedef {object} RFCBufferOptions
 * @property {Uint8Array} [buf] - Buffer to write the UUID into; when given, the generator returns it instead of a string
 * @property {number} [offset] - Offset in `buf` to start writing at (default 0)
 */

/**
 * Options for {@link UUID.v1} and {@link UUID.v6}. `node` is the 6-byte node id (MAC address),
 * `clockseq` the 14-bit clock sequence, `msecs` the timestamp in milliseconds since the Unix
 * epoch, and `nsecs` additional 100-nanosecond intervals.
 * @typedef {RFCBufferOptions & { node?: ArrayLike<number>, clockseq?: number, msecs?: number, nsecs?: number }} TimeOptions
 */

/**
 * Options for {@link UUID.v4}. `random` supplies the 16 random bytes instead of generating them.
 * @typedef {RFCBufferOptions & { random?: Uint8Array }} V4Options
 */

/**
 * Options for {@link UUID.v7}. `msecs` is the timestamp in milliseconds since the Unix epoch.
 * @typedef {RFCBufferOptions & { msecs?: number }} V7Options
 */

/**
 * Options for {@link UUID.v8}. `data` supplies the 16 bytes of custom data instead of random bytes.
 * @typedef {RFCBufferOptions & { data?: Uint8Array }} V8Options
 */

/**
 * UUID class implementing the new specification
 */
class UUID {
	/**
	 * Create a new UUID instance
	 * @param {Uint8Array|string|null} data - Optional UUID data to parse
	 */
	constructor(data = null) {
		/**
		 * The 16 UUID bytes.
		 * @type {Uint8Array}
		 * @private
		 */
		this._buffer = new Uint8Array(16);

		if (data !== null && data !== undefined) {
			this._parseFromData(data);
		}
	}

	/**
	 * Parse UUID from existing data
	 * @param {Uint8Array|string} data - UUID data to parse
	 * @private
	 */
	_parseFromData(data) {
		if (typeof data === "string") {
			// Remove dashes and convert hex string to buffer
			const hex = data.replace(/-/g, "");
			if (hex.length !== 32) {
				throw new Error("Invalid UUID string length");
			}
			this._buffer = fromHex(hex);
		} else if (data instanceof Uint8Array) {
			if (data.length !== 16) {
				throw new Error("Invalid UUID buffer length");
			}
			this._buffer = new Uint8Array(data);
		} else {
			throw new Error("Invalid UUID data type");
		}
	}

	/**
	 * Create a new Issuer Variant UUID
	 * @param {number} issuerID - Issuer ID (0-ISSUER_ID_MASK)
	 * @param {number} version - Version number
	 * @param {Uint8Array|null} [entropy] - Additional entropy data
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
			entropy = randomBytes(16);
		}
		uuid._fillEntropy(entropy);

		return uuid;
	}

	/**
	 * Create a new Timestamp Variant UUID
	 * Versions 1 and 3 store seconds, versions 2 and 4 store milliseconds. Versions 3 and 4 lay the magnitude out most significant bit first (byte order is chronological); versions 1 and 2 keep the legacy low-word-first layout.
	 * @param {number|Date|null|undefined} timestamp - Timestamp value (null/undefined defaults to the current time)
	 * @param {number} version - Version number (1 or 3 for seconds, 2 or 4 for milliseconds)
	 * @param {Uint8Array|null} [entropy] - Optional entropy for bits 79-127
	 * @returns {UUID} New UUID instance
	 */
	static createTimestampVariant(timestamp, version, entropy = null) {
		const uuid = new UUID();

		// Use current time if timestamp not provided
		// Versions 1 and 3: seconds, versions 2 and 4: milliseconds
		const seconds = isSecondsVersion(version);
		if (timestamp === undefined || timestamp === null) {
			if (seconds) {
				timestamp = Math.floor(Date.now() / 1000); // seconds
			} else {
				timestamp = Date.now(); // milliseconds
			}
		}

		// Convert Date objects to appropriate timestamp value
		let timestampValue;
		if (timestamp instanceof Date) {
			if (seconds) {
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
			entropy = randomBytes(16);
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
		uuid._setTimestamp(timestampValue, isOrderedVersion(version));

		return uuid;
	}

	/**
	 * Create an issuer-based UUID (short name alias)
	 * @param {number} issuerID - Issuer ID (0-1023)
	 * @param {number} version - Version number
	 * @param {Uint8Array|null} [entropy] - Additional entropy data
	 * @returns {UUID} New UUID instance
	 */
	static issuer(issuerID, version, entropy = null) {
		return UUID.createIssuerVariant(issuerID, version, entropy);
	}

	/**
	 * Create a timestamp-based UUID (short name alias)
	 * @param {number|Date|null|undefined} timestamp - Timestamp value (null/undefined defaults to the current time)
	 * @param {number} version - Version number (1 or 3 for seconds, 2 or 4 for milliseconds)
	 * @param {Uint8Array|null} [entropy] - Optional entropy for bits 79-127
	 * @returns {UUID} New UUID instance
	 */
	static timestamp(timestamp, version, entropy = null) {
		return UUID.createTimestampVariant(timestamp, version, entropy);
	}

	/**
	 * Create a Timestamp Variant UUID in seconds (ultra-short alias)
	 * Subvariant 00 - Timestamp-based identification (seconds precision). Mints version 3, the ordered layout; version 1 (legacy layout) is still decoded.
	 * @param {number|Date|null} [timestamp] - Timestamp value (optional, defaults to the current time)
	 * @param {Uint8Array|null} [entropy] - Optional entropy for bits 79-127
	 * @returns {UUID} New UUID instance
	 */
	static TA(timestamp, entropy = null) {
		return UUID.createTimestampVariant(timestamp, 3, entropy);
	}

	/**
	 * Create Issuer Variant v1 UUID (ultra-short alias)
	 * Subvariant 01 - Issuer-based identification
	 * @param {number} issuerID - Issuer ID (0-1023)
	 * @param {Uint8Array|null} [entropy] - Additional entropy data
	 * @returns {UUID} New UUID instance
	 */
	static IA(issuerID, entropy = null) {
		return UUID.createIssuerVariant(issuerID, 1, entropy);
	}

	/**
	 * Create a Timestamp Variant UUID in milliseconds (ultra-short alias)
	 * Subvariant 00 - Timestamp-based identification (milliseconds precision). Mints version 4, the ordered layout; version 2 (legacy layout) is still decoded.
	 * @param {number|Date|null} [timestamp] - Timestamp value (optional, defaults to the current time)
	 * @param {Uint8Array|null} [entropy] - Optional entropy for bits 79-127
	 * @returns {UUID} New UUID instance
	 */
	static TB(timestamp, entropy = null) {
		return UUID.createTimestampVariant(timestamp, 4, entropy);
	}

	/**
	 * Set 70-bit timestamp according to specification
	 * @param {number} timestampValue - Timestamp value (in seconds for versions 1 and 3, milliseconds for versions 2 and 4)
	 * @param {boolean} [ordered] - True for the ordered layout (versions 3 and 4), false for the legacy layout (versions 1 and 2)
	 * @private
	 */
	_setTimestamp(timestampValue, ordered = true) {
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

		this._setStoredMagnitude(storedMagnitude, ordered);
	}

	/**
	 * Write the 69-bit stored magnitude (already in negative-ordering form) into segment A (bits 1-63) and bits 69-74
	 * @param {bigint} storedMagnitude - Stored 69-bit magnitude
	 * @param {boolean} ordered - True for the ordered layout (versions 3 and 4), false for the legacy layout (versions 1 and 2)
	 * @private
	 */
	_setStoredMagnitude(storedMagnitude, ordered) {
		// Split the stored magnitude into components.
		// magnitude bits 62..32 (31 bits) and bits 31..0 (32 bits)
		const upper31 = Number((storedMagnitude >> BigInt(32)) & BigInt(0x7fffffff));
		const lower32 = Number(storedMagnitude & BigInt(0xffffffff));
		if (ordered) {
			// Ordered layout (versions 3 and 4): segment A (bits 1-63) holds the
			// magnitude most significant bit first, so the byte order of the UUID
			// follows the timestamp order (spec 7.3): upper 31 bits at bits 1-31,
			// lower 32 bits at bits 32-63.
			BitUtils.setBits(this._buffer, 1, 31, upper31);
			BitUtils.setBits(this._buffer, 32, 32, lower32);
		} else {
			// Legacy layout (versions 1 and 2, kept so existing ids decode as
			// before): lower 32 bits at bits 1-32, upper 31 bits at bits 33-63.
			BitUtils.setBits(this._buffer, 1, 32, lower32);
			BitUtils.setBits(this._buffer, 33, 31, upper31);
		}

		// Set upper 6 bits, magnitude bits 68..63 (bits 69-74)
		const upper6 = Number((storedMagnitude >> BigInt(63)) & BigInt(0x3f));
		BitUtils.setBits(this._buffer, 69, 6, upper6);
	}

	/**
	 * Read the 69-bit stored magnitude (negative-ordering form) from segment A and bits 69-74, choosing the layout by version
	 * @returns {bigint} Stored 69-bit magnitude
	 * @private
	 */
	_getStoredMagnitude() {
		// Versions 3 and 4 use the ordered layout (magnitude bits 62..32 at bits
		// 1-31, bits 31..0 at bits 32-63); versions 1 and 2 use the legacy layout
		// (bits 31..0 at bits 1-32, bits 62..32 at bits 33-63).
		let middle31;
		let lower32;
		if (isOrderedVersion(this.getVersion())) {
			middle31 = BigInt(BitUtils.getBitsAsNumber(this._buffer, 1, 31));
			lower32 = BigInt(BitUtils.getBitsAsNumber(this._buffer, 32, 32));
		} else {
			lower32 = BigInt(BitUtils.getBitsAsNumber(this._buffer, 1, 32));
			middle31 = BigInt(BitUtils.getBitsAsNumber(this._buffer, 33, 31));
		}

		// Get upper 6 bits (bits 69-74)
		const upper6 = BigInt(BitUtils.getBitsAsNumber(this._buffer, 69, 6));

		// Reconstruct the stored 69-bit magnitude: lower32 | (middle31 << 32) | (upper6 << 63)
		return lower32 | (middle31 << BigInt(32)) | (upper6 << BigInt(63));
	}

	/**
	 * Fill remaining bits with entropy while preserving immutable fields
	 * @param {Uint8Array|null} [entropy] - Entropy data
	 * @private
	 */
	_fillEntropy(entropy) {
		// Save immutable field values before filling entropy
		const variant = this.getVariant();
		const subvariant = this.getSubvariant();
		const version = this.getVersion();
		const issuerID = this.getIssuerID();

		// Apply entropy to entire buffer
		this._buffer.set(entropy);

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
	 * Get the version/variant identifier (TA, TB, IA for custom variants, or RFC version number)
	 * @returns {string|number|null} Version identifier (e.g., "TA", "TB", "IA", 1-8 for RFC, or null if invalid)
	 * @example
	 * uuid.version(); // => "TA" for Timestamp v3 (and legacy v1)
	 * uuid.version(); // => "TB" for Timestamp v4 (and legacy v2)
	 * uuid.version(); // => "IA" for Issuer v1
	 * uuid.version(); // => 4 for RFC v4
	 */
	version() {
		// Check if this is a custom UUID (variant = 111)
		if (this.isUUID()) {
			const subvariant = this.getSubvariant();
			const version = this.getVersion();

			// Timestamp Variant (subvariant 00)
			if (subvariant === SUBVARIANT_TIMESTAMP) {
				if (version === 1 || version === 3) return "TA";
				if (version === 2 || version === 4) return "TB";
				// Future timestamp versions can be added here
				return `Timestamp v${version}`;
			}

			// Issuer Variant (subvariant 01)
			if (subvariant === SUBVARIANT_ISSUER) {
				if (version === 1) return "IA";
				// Future issuer versions can be added here
				return `Issuer v${version}`;
			}

			// Reserved subvariants
			if (subvariant === SUBVARIANT_RESERVED_10 || subvariant === SUBVARIANT_RESERVED_11) {
				return `Reserved (subvariant ${subvariant})`;
			}

			return null;
		}

		// Not a custom UUID, check if it's a valid RFC UUID
		const uuidString = this.toString();
		const rfcVersion = rfcUuids.version(uuidString);
		return rfcVersion;
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
	 * Check whether this is a Timestamp Variant UUID in the legacy low-word-first layout (versions 1 and 2)
	 * Select stored ids to rewrite with {@link UUID.migrate}.
	 * @returns {boolean} True for timestamp-variant versions 1 and 2
	 */
	isLegacyTimestampLayout() {
		if (!this.isTimestampVariant()) {
			return false;
		}
		const version = this.getVersion();
		return version === 1 || version === 2;
	}

	/**
	 * Rewrite a legacy timestamp id (version 1 or 2) into the ordered layout (version 3 or 4)
	 * The sign, the timestamp value and the 49 entropy bits (bits 79-127) are carried over unchanged, so the mapping is deterministic: the same legacy id always migrates to the same new id. Ids already at version 3 or 4, and every non-timestamp UUID, come back as an equal copy. Throws only when the input cannot be parsed.
	 * @param {UUID|string|Uint8Array} input - A UUID instance, a UUID string, or a 16-byte buffer
	 * @returns {UUID} New UUID instance
	 * @example
	 * UUID.migrate("e7f2b400-0000-018b-e005-c289f23865d3").toString(); // version 2 -> version 4, same timestamp
	 */
	static migrate(input) {
		const source = input instanceof UUID ? input : new UUID(input);
		const result = new UUID(source._buffer);
		if (!source.isLegacyTimestampLayout()) {
			return result;
		}

		const stored = source._getStoredMagnitude();
		result._setVersion(source.getVersion() + 2);
		result._setStoredMagnitude(stored, true);
		return result;
	}

	/**
	 * Get the timestamp value from a Timestamp Variant UUID
	 * @returns {number|null} Timestamp value in the stored precision (seconds for versions 1 and 3, milliseconds for versions 2 and 4), or null if not a Timestamp Variant
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

		const storedMagnitude = this._getStoredMagnitude();

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
		const hex = toHex(this._buffer);
		return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
	}

	/**
	 * Convert UUID to buffer
	 * @returns {Bytes} UUID as a 16-byte copy: a Node Buffer (a Uint8Array subclass) in Node, a plain Uint8Array in environments without Buffer
	 */
	toBuffer() {
		return toBufferLike(this._buffer);
	}

	/**
	 * Return the primitive value of the UUID (string representation)
	 * This allows UUIDs to be automatically converted to strings when used in string contexts
	 * @returns {string} UUID string with dashes
	 */
	valueOf() {
		return this.toString();
	}

	/**
	 * Handle type coercion for different contexts
	 * @returns {string} UUID string representation
	 */
	[Symbol.toPrimitive]() {
		return this.toString();
	}

	/**
	 * Custom inspect for Node.js console output
	 * @returns {string} UUID string with dashes
	 */
	[Symbol.for("nodejs.util.inspect.custom")]() {
		return this.toString();
	}

	/**
	 * Convert UUID to JSON representation (as string)
	 * @returns {string} UUID string with dashes
	 */
	toJSON() {
		return this.toString();
	}

	/**
	 * Get the version/variant identifier (alias for version())
	 * @returns {string|number|null} Version identifier
	 * @deprecated Use .version() instead
	 */
	getVariantIdentifier() {
		return this.version();
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
			variantIdentifier: this.version(),
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
	 * @returns {Promise<import("./lib/issuer-registry.mjs").IssuerRegistry>} Shared registry instance
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
	 * @param {Uint8Array} buffer - UUID buffer to validate
	 * @returns {Promise<object>} Validation results
	 */
	static async validate(buffer) {
		const { UUIDValidator } = await import("./lib/validators.mjs");
		return UUIDValidator.validateCompleteUUID(buffer);
	}

	/**
	 * Generate a complete validation report for a UUID
	 * @param {Uint8Array} buffer - UUID buffer to validate
	 * @returns {Promise<object>} Detailed validation report
	 */
	static async validateDetailed(buffer) {
		const { UUIDValidator } = await import("./lib/validators.mjs");
		return UUIDValidator.generateValidationReport(buffer);
	}

	// RFC 4122 / RFC 9562 Standard UUID Methods
	// Delegates to lib/versions/rfc/

	/**
	 * Generate a version 1 (timestamp) UUID
	 * @overload
	 * @param {TimeOptions & { buf?: undefined }} [options] - Optional parameters
	 * @returns {string} UUID string
	 */
	/**
	 * Generate a version 1 (timestamp) UUID, written into `options.buf`
	 * @template {Uint8Array} T
	 * @overload
	 * @param {TimeOptions & { buf: T }} options - Options with the buffer to write into
	 * @returns {T} `options.buf` itself, so its type is kept (a Buffer stays a Buffer)
	 */
	/**
	 * Generate a version 1 (timestamp) UUID
	 * @param {TimeOptions} [options] - Optional parameters
	 * @returns {string|Uint8Array} UUID string, or `options.buf` when one is given
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
	 * @overload
	 * @param {V4Options & { buf?: undefined }} [options] - Optional parameters
	 * @returns {string} UUID string
	 */
	/**
	 * Generate a version 4 (random) UUID, written into `options.buf`
	 * @template {Uint8Array} T
	 * @overload
	 * @param {V4Options & { buf: T }} options - Options with the buffer to write into
	 * @returns {T} `options.buf` itself, so its type is kept (a Buffer stays a Buffer)
	 */
	/**
	 * Generate a version 4 (random) UUID
	 * @param {V4Options} [options] - Optional parameters
	 * @returns {string|Uint8Array} UUID string, or `options.buf` when one is given
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
	 * @overload
	 * @param {TimeOptions & { buf?: undefined }} [options] - Optional parameters
	 * @returns {string} UUID string
	 */
	/**
	 * Generate a version 6 (timestamp, reordered) UUID, written into `options.buf`
	 * @template {Uint8Array} T
	 * @overload
	 * @param {TimeOptions & { buf: T }} options - Options with the buffer to write into
	 * @returns {T} `options.buf` itself, so its type is kept (a Buffer stays a Buffer)
	 */
	/**
	 * Generate a version 6 (timestamp, reordered) UUID
	 * @param {TimeOptions} [options] - Optional parameters
	 * @returns {string|Uint8Array} UUID string, or `options.buf` when one is given
	 */
	static v6(options) {
		return rfcUuids.v6(options);
	}

	/**
	 * Generate a version 7 (Unix Epoch) UUID
	 * @overload
	 * @param {V7Options & { buf?: undefined }} [options] - Optional parameters
	 * @returns {string} UUID string
	 */
	/**
	 * Generate a version 7 (Unix Epoch) UUID, written into `options.buf`
	 * @template {Uint8Array} T
	 * @overload
	 * @param {V7Options & { buf: T }} options - Options with the buffer to write into
	 * @returns {T} `options.buf` itself, so its type is kept (a Buffer stays a Buffer)
	 */
	/**
	 * Generate a version 7 (Unix Epoch) UUID
	 * @param {V7Options} [options] - Optional parameters
	 * @returns {string|Uint8Array} UUID string, or `options.buf` when one is given
	 */
	static v7(options) {
		return rfcUuids.v7(options);
	}

	/**
	 * Generate a version 8 (custom/experimental) UUID
	 * @overload
	 * @param {V8Options & { buf?: undefined }} [options] - Optional parameters
	 * @returns {string} UUID string
	 */
	/**
	 * Generate a version 8 (custom/experimental) UUID, written into `options.buf`
	 * @template {Uint8Array} T
	 * @overload
	 * @param {V8Options & { buf: T }} options - Options with the buffer to write into
	 * @returns {T} `options.buf` itself, so its type is kept (a Buffer stays a Buffer)
	 */
	/**
	 * Generate a version 8 (custom/experimental) UUID
	 * @param {V8Options} [options] - Optional parameters
	 * @returns {string|Uint8Array} UUID string, or `options.buf` when one is given
	 */
	static v8(options) {
		return rfcUuids.v8(options);
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
	 * @param {ArrayLike<number>} bytes - 16-byte array (Uint8Array, Buffer or plain array)
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
	 * Detect version/variant identifier of UUID (handles both RFC and custom variants)
	 * @param {string|Uint8Array|UUID} uuid - UUID string, buffer, or UUID instance
	 * @returns {string|number|null} Version identifier (e.g., "TA", "TB", "IA" for custom, 1-8 for RFC, or null if invalid)
	 * @example
	 * UUID.version(uuidString); // => "TA" for Timestamp v1
	 * UUID.version(uuidString); // => "TB" for Timestamp v2
	 * UUID.version(uuidString); // => "IA" for Issuer v1
	 * UUID.version(uuidString); // => 4 for RFC v4
	 */
	static version(uuid) {
		// If it's already a UUID instance, use its method
		if (uuid instanceof UUID) {
			return uuid.version();
		}

		// Convert to UUID instance
		try {
			const uuidInstance = new UUID(uuid);
			return uuidInstance.version();
		} catch {
			// If parsing fails, try RFC version detection as fallback
			if (typeof uuid === "string") {
				return rfcUuids.version(uuid);
			}
			return null;
		}
	}

	/**
	 * Detect variant identifier (alias for version())
	 * @param {string|Uint8Array|UUID} uuid - UUID string, buffer, or UUID instance
	 * @returns {string|number|null} Version identifier
	 * @deprecated Use UUID.version() instead
	 */
	static detectVariant(uuid) {
		return UUID.version(uuid);
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
