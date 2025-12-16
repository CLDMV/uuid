/**
 * Validator class for UUID specification compliance
 */
export class UUIDValidator {
    /**
     * Validate complete UUID compliance with custom specification
     * @param {Buffer} uuidBuffer - 16-byte UUID buffer
     * @returns {Object} Validation results
     */
    static validateCompleteUUID(uuidBuffer: Buffer): any;
    /**
     * Validate UUID specific fields
     * @param {Buffer} uuidBuffer - UUID buffer
     * @param {Object} results - Results object to populate
     * @private
     */
    private static _validateUUIDFields;
    /**
     * Validate issuer variant specific requirements
     * @param {Buffer} uuidBuffer - UUID buffer
     * @param {Object} results - Results object to populate
     * @private
     */
    private static _validateIssuerVariant;
    /**
     * Validate timestamp variant specific requirements
     * @param {Buffer} uuidBuffer - UUID buffer
     * @param {Object} results - Results object to populate
     * @private
     */
    private static _validateTimestampVariant;
    /**
     * Validate bit layout compliance
     * @param {Buffer} uuidBuffer - UUID buffer
     * @returns {Object} Bit layout validation results
     */
    static validateBitLayout(uuidBuffer: Buffer): any;
    /**
     * Validate entropy distribution in non-immutable fields
     * @param {Buffer} uuidBuffer - UUID buffer
     * @returns {Object} Entropy validation results
     */
    static validateEntropy(uuidBuffer: Buffer): any;
    /**
     * Get issuer category name from issuer ID
     * @param {number} issuerID - Issuer ID
     * @returns {string} Category name
     */
    static getIssuerCategory(issuerID: number): string;
    /**
     * Validate issuer ID is not in an immutable reserved range
     * @param {number} issuerID - Issuer ID to validate
     * @returns {Object} Validation result
     */
    static validateIssuerIDMutability(issuerID: number): any;
    /**
     * Generate a comprehensive validation report
     * @param {Buffer} uuidBuffer - UUID buffer to validate
     * @returns {Object} Comprehensive validation report
     */
    static generateValidationReport(uuidBuffer: Buffer): any;
}
//# sourceMappingURL=validators.d.mts.map