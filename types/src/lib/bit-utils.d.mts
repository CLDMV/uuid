/**
 * Bit Manipulation Utilities
 *
 * Low-level bit manipulation utilities for custom UUID implementation.
 * These utilities handle precise bit operations required by the specification.
 */
/**
 * Bit manipulation utility class
 */
export class BitUtils {
    /**
     * Set specific bits in a buffer
     * @param {Buffer} buffer - Target buffer
     * @param {number} startBit - Starting bit position (0-based)
     * @param {number} bitCount - Number of bits to set
     * @param {number|BigInt} value - Value to set
     */
    static setBits(buffer: Buffer, startBit: number, bitCount: number, value: number | bigint): void;
    /**
     * Get specific bits from a buffer
     * @param {Buffer} buffer - Source buffer
     * @param {number} startBit - Starting bit position (0-based)
     * @param {number} bitCount - Number of bits to get
     * @returns {BigInt} The extracted value as BigInt
     */
    static getBits(buffer: Buffer, startBit: number, bitCount: number): bigint;
    /**
     * Get specific bits from a buffer as a regular number (for values <= 32 bits)
     * @param {Buffer} buffer - Source buffer
     * @param {number} startBit - Starting bit position (0-based)
     * @param {number} bitCount - Number of bits to get (max 32)
     * @returns {number} The extracted value as number
     */
    static getBitsAsNumber(buffer: Buffer, startBit: number, bitCount: number): number;
    /**
     * Clear specific bits in a buffer
     * @param {Buffer} buffer - Target buffer
     * @param {number} startBit - Starting bit position (0-based)
     * @param {number} bitCount - Number of bits to clear
     */
    static clearBits(buffer: Buffer, startBit: number, bitCount: number): void;
    /**
     * Toggle specific bits in a buffer
     * @param {Buffer} buffer - Target buffer
     * @param {number} startBit - Starting bit position (0-based)
     * @param {number} bitCount - Number of bits to toggle
     */
    static toggleBits(buffer: Buffer, startBit: number, bitCount: number): void;
    /**
     * Create a bit mask for specific bit positions
     * @param {number} totalBits - Total number of bits in the mask
     * @param {Array<number>} bitPositions - Array of bit positions to set
     * @returns {Buffer} Buffer containing the bit mask
     */
    static createBitMask(totalBits: number, bitPositions: Array<number>): Buffer;
    /**
     * Apply a bit mask to a buffer (AND operation)
     * @param {Buffer} buffer - Target buffer to modify
     * @param {Buffer} mask - Bit mask to apply
     */
    static applyMask(buffer: Buffer, mask: Buffer): void;
    /**
     * Apply an inverted bit mask to a buffer (clear masked bits)
     * @param {Buffer} buffer - Target buffer to modify
     * @param {Buffer} mask - Bit mask to invert and apply
     */
    static applyInvertedMask(buffer: Buffer, mask: Buffer): void;
    /**
     * Count the number of set bits in a buffer
     * @param {Buffer} buffer - Buffer to count bits in
     * @returns {number} Number of set bits
     */
    static countSetBits(buffer: Buffer): number;
    /**
     * Convert a buffer to a binary string representation
     * @param {Buffer} buffer - Buffer to convert
     * @param {boolean} includeSeparators - Whether to include byte separators
     * @returns {string} Binary string representation
     */
    static toBinaryString(buffer: Buffer, includeSeparators?: boolean): string;
    /**
     * Convert a binary string to a buffer
     * @param {string} binaryString - Binary string (without separators)
     * @param {number} byteCount - Expected number of bytes
     * @returns {Buffer} Resulting buffer
     */
    static fromBinaryString(binaryString: string, byteCount: number): Buffer;
    /**
     * Validate that a bit position is within valid range for a buffer
     * @param {Buffer} buffer - Buffer to validate against
     * @param {number} bitPosition - Bit position to validate
     * @throws {Error} If bit position is invalid
     */
    static validateBitPosition(buffer: Buffer, bitPosition: number): void;
    /**
     * Get a human-readable representation of specific bit fields
     * @param {Buffer} buffer - Buffer to analyze
     * @param {Object} fieldDefinitions - Object mapping field names to {start, length} definitions
     * @returns {Object} Object with field names as keys and their values
     */
    static getFieldValues(buffer: Buffer, fieldDefinitions: any): any;
}
//# sourceMappingURL=bit-utils.d.mts.map