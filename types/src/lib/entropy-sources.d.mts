/**
 * Entropy source and validation utilities
 */
export class EntropySource {
    /**
     * Generate cryptographically secure random bytes
     * @param {number} byteCount - Number of bytes to generate
     * @returns {Uint8Array} Random bytes
     */
    static generateSecureBytes(byteCount: number): Uint8Array;
    /**
     * Generate at least the given number of random bits, rounded up to whole bytes
     * @param {number} entropyBits - Number of entropy bits required
     * @returns {Uint8Array} Random bytes
     */
    static generateEntropy(entropyBits: number): Uint8Array;
    /**
     * Calculate required entropy bits using Birthday Bound formula
     * @param {number} targetCollisionProbability - Target collision probability (e.g., 0.0001 for 0.01%)
     * @param {number} expectedUUIDs - Expected number of UUIDs to generate
     * @returns {number} Required entropy bits
     */
    static calculateRequiredEntropy(targetCollisionProbability: number, expectedUUIDs: number): number;
    /**
     * Sanity-check a byte source: not all zeros, not all ones, a set-bit count within
     * 4 standard deviations of half, and no excessively long run of one bit value. These
     * catch a broken or stuck source; they are not a randomness proof.
     * @param {Uint8Array} entropy - Bytes to check
     * @returns {{byteCount: number, bitCount: number, passed: boolean, tests: Record<string, {passed: boolean, value?: number, min?: number, max?: number, description: string}>}} Validation results
     */
    static validateEntropyQuality(entropy: Uint8Array): {
        byteCount: number;
        bitCount: number;
        passed: boolean;
        tests: Record<string, {
            passed: boolean;
            value?: number;
            min?: number;
            max?: number;
            description: string;
        }>;
    };
    /**
     * Generate random bytes that pass validateEntropyQuality, retrying up to maxAttempts times
     * @param {number} byteCount - Number of bytes to generate
     * @param {number} [maxAttempts=10] - Maximum number of generation attempts
     * @returns {Uint8Array} Validated random bytes
     */
    static generateValidatedEntropy(byteCount: number, maxAttempts?: number): Uint8Array;
    /**
     * XOR several byte sources together; shorter sources are padded with zeros
     * @param {Array<Uint8Array>} sources - Byte sources to mix
     * @returns {Uint8Array} Mixed bytes, as long as the longest source
     */
    static mixEntropySources(sources: Array<Uint8Array>): Uint8Array;
    /**
     * SHA-256 of a timestamp plus fresh random bytes, so the result never depends on the
     * timestamp alone
     * @param {number|bigint|string|Date} timestamp - Timestamp component (milliseconds for a Date); any whole number within ±(2^69 - 1)
     * @param {number} [additionalBytes=16] - Random bytes to mix in
     * @returns {Uint8Array} 32-byte digest
     */
    static createTimestampIndependentEntropy(timestamp: number | bigint | string | Date, additionalBytes?: number): Uint8Array;
    /**
     * Estimate the information in a byte string from its byte-value frequencies (Shannon
     * entropy per byte times the length). Short inputs underestimate: n bytes can show at
     * most log2(n) bits per byte.
     * @param {Uint8Array} buffer - Bytes to analyze
     * @returns {number} Estimated entropy in bits
     */
    static estimateShannonEntropy(buffer: Uint8Array): number;
    /**
     * Sample a generator and flag signs that it depends on the clock (repeated outputs,
     * suspiciously even timing)
     * @param {() => Uint8Array} entropyGenerator - Function that returns a fresh byte array per call
     * @param {number} [sampleCount=100] - Number of samples to take
     * @returns {{sampleCount: number, avgGenerationTime: number, uniqueSamples: number, appearsClockBased: boolean, warnings: string[]}} Analysis results
     */
    static analyzeEntropySource(entropyGenerator: () => Uint8Array, sampleCount?: number): {
        sampleCount: number;
        avgGenerationTime: number;
        uniqueSamples: number;
        appearsClockBased: boolean;
        warnings: string[];
    };
}
//# sourceMappingURL=entropy-sources.d.mts.map