/**
 * Entropy source and validation utilities
 */
export class EntropySource {
    /**
     * Generate cryptographically secure random bytes
     * @param {number} byteCount - Number of bytes to generate
     * @returns {Buffer} Random bytes
     */
    static generateSecureBytes(byteCount: number): Buffer;
    /**
     * Generate entropy for UUID with specified bit requirements
     * @param {number} entropyBits - Number of entropy bits required
     * @returns {Buffer} Entropy buffer
     */
    static generateEntropy(entropyBits: number): Buffer;
    /**
     * Calculate required entropy bits using Birthday Bound formula
     * @param {number} targetCollisionProbability - Target collision probability (e.g., 0.0001 for 0.01%)
     * @param {number} expectedUUIDs - Expected number of UUIDs to generate
     * @returns {number} Required entropy bits
     */
    static calculateRequiredEntropy(targetCollisionProbability: number, expectedUUIDs: number): number;
    /**
     * Validate entropy quality using statistical tests
     * @param {Buffer} entropy - Entropy to validate
     * @returns {Object} Validation results
     */
    static validateEntropyQuality(entropy: Buffer): any;
    /**
     * Generate high-quality entropy with validation
     * @param {number} byteCount - Number of bytes to generate
     * @param {number} maxAttempts - Maximum number of generation attempts
     * @returns {Buffer} Validated entropy
     */
    static generateValidatedEntropy(byteCount: number, maxAttempts?: number): Buffer;
    /**
     * Mix multiple entropy sources together
     * @param {Array<Buffer>} sources - Array of entropy sources
     * @returns {Buffer} Mixed entropy
     */
    static mixEntropySources(sources: Array<Buffer>): Buffer;
    /**
     * Create entropy from timestamp with additional randomness
     * Note: This method ensures the entropy is NOT solely dependent on the timestamp
     * @param {number|Date} timestamp - Timestamp component
     * @param {number} additionalBytes - Additional random bytes to mix in
     * @returns {Buffer} Mixed entropy
     */
    static createTimestampIndependentEntropy(timestamp: number | Date, additionalBytes?: number): Buffer;
    /**
     * Estimate entropy in a buffer using Shannon entropy
     * @param {Buffer} buffer - Buffer to analyze
     * @returns {number} Estimated entropy in bits
     */
    static estimateShannnonEntropy(buffer: Buffer): number;
    /**
     * Check if entropy source appears to be clock-based
     * @param {Function} entropyGenerator - Function that generates entropy
     * @param {number} sampleCount - Number of samples to analyze
     * @returns {Object} Analysis results
     */
    static analyzeEntropySource(entropyGenerator: Function, sampleCount?: number): any;
}
//# sourceMappingURL=entropy-sources.d.mts.map