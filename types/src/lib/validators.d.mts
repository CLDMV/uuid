/**
 * Validator class for UUID specification compliance
 */
export class UUIDValidator {
    /**
     * Validate a UUID against the specification and describe it. `fields` has the same keys
     * for every UUID, CLDMV or RFC: the {@link UUID#getInfo} fields (with `timestamp` as a
     * bigint) plus the raw timestamp-variant bit fields, each null when it doesn't apply.
     * @param {Uint8Array} uuidBuffer - 16-byte UUID buffer
     * @returns {Object} Validation results
     */
    static validateCompleteUUID(uuidBuffer: Uint8Array): Object;
    /**
     * Check the CLDMV fields
     * @param {Uint8Array} uuidBuffer - UUID buffer
     * @param {Object} results - Results object to populate
     * @private
     */
    private static _validateUUIDFields;
    /**
     * Check issuer-variant requirements
     * @param {Uint8Array} uuidBuffer - UUID buffer
     * @param {Object} results - Results object to populate
     * @private
     */
    private static _validateIssuerVariant;
    /**
     * Record the raw timestamp-variant bit fields
     * @param {Uint8Array} uuidBuffer - UUID buffer
     * @param {Object} results - Results object to populate
     * @param {number} version - Bits 75-78
     * @private
     */
    private static _validateTimestampVariant;
    /**
     * Read the bit fields. `bitFields` has the same keys for every UUID, each null when the
     * UUID's variant doesn't define it; `version` is bits 75-78 for a CLDMV id and bits
     * 48-51 for an RFC UUID.
     * @param {Uint8Array} uuidBuffer - UUID buffer
     * @returns {Object} Bit layout validation results
     */
    static validateBitLayout(uuidBuffer: Uint8Array): Object;
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
    private static _entropyRanges;
    /**
     * Analyze the random bits of a UUID. The keys are the same for every UUID;
     * `entropyBits` and `analysis.bitBalance` are null when it has no random field.
     * @param {Uint8Array} uuidBuffer - UUID buffer
     * @returns {Object} Entropy analysis results
     */
    static validateEntropy(uuidBuffer: Uint8Array): Object;
    /**
     * Get issuer category for an issuer ID
     * @param {number} issuerID - Issuer ID
     * @returns {string} Category name, the same one uuid.getIssuerCategory() returns
     */
    static getIssuerCategory(issuerID: number): string;
    /**
     * Validate issuer ID is not in an immutable reserved range
     * @param {number} issuerID - Issuer ID to validate
     * @returns {Object} Validation result
     */
    static validateIssuerIDMutability(issuerID: number): Object;
    /**
     * Generate a comprehensive validation report
     * @param {Uint8Array} uuidBuffer - UUID buffer to validate
     * @returns {Object} Comprehensive validation report
     */
    static generateValidationReport(uuidBuffer: Uint8Array): Object;
}
//# sourceMappingURL=validators.d.mts.map