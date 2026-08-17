/**
 *	@Project: @cldmv/uuid
 *	@Filename: /src/lib/bit-utils.mjs
 *	@Date: 2025-12-15T20:33:49-08:00 (1765859629)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Shinrai <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-08-08 17:13:20 -07:00 (1786234400)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */
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
     * @param {Uint8Array} buffer - Target buffer
     * @param {number} startBit - Starting bit position (0-based)
     * @param {number} bitCount - Number of bits to set
     * @param {number|BigInt} value - Value to set
     */
    static setBits(buffer: Uint8Array, startBit: number, bitCount: number, value: number | bigint): void;
    /**
     * Get specific bits from a buffer
     * @param {Uint8Array} buffer - Source buffer
     * @param {number} startBit - Starting bit position (0-based)
     * @param {number} bitCount - Number of bits to get
     * @returns {BigInt} The extracted value as BigInt
     */
    static getBits(buffer: Uint8Array, startBit: number, bitCount: number): bigint;
    /**
     * Get specific bits from a buffer as a regular number (for values <= 32 bits)
     * @param {Uint8Array} buffer - Source buffer
     * @param {number} startBit - Starting bit position (0-based)
     * @param {number} bitCount - Number of bits to get (max 32)
     * @returns {number} The extracted value as number
     */
    static getBitsAsNumber(buffer: Uint8Array, startBit: number, bitCount: number): number;
    /**
     * Clear specific bits in a buffer
     * @param {Uint8Array} buffer - Target buffer
     * @param {number} startBit - Starting bit position (0-based)
     * @param {number} bitCount - Number of bits to clear
     */
    static clearBits(buffer: Uint8Array, startBit: number, bitCount: number): void;
    /**
     * Toggle specific bits in a buffer
     * @param {Uint8Array} buffer - Target buffer
     * @param {number} startBit - Starting bit position (0-based)
     * @param {number} bitCount - Number of bits to toggle
     */
    static toggleBits(buffer: Uint8Array, startBit: number, bitCount: number): void;
    /**
     * Create a bit mask for specific bit positions
     * @param {number} totalBits - Total number of bits in the mask
     * @param {Array<number>} bitPositions - Array of bit positions to set
     * @returns {Uint8Array} Buffer containing the bit mask
     */
    static createBitMask(totalBits: number, bitPositions: Array<number>): Uint8Array;
    /**
     * Apply a bit mask to a buffer (AND operation)
     * @param {Uint8Array} buffer - Target buffer to modify
     * @param {Uint8Array} mask - Bit mask to apply
     */
    static applyMask(buffer: Uint8Array, mask: Uint8Array): void;
    /**
     * Apply an inverted bit mask to a buffer (clear masked bits)
     * @param {Uint8Array} buffer - Target buffer to modify
     * @param {Uint8Array} mask - Bit mask to invert and apply
     */
    static applyInvertedMask(buffer: Uint8Array, mask: Uint8Array): void;
    /**
     * Count the number of set bits in a buffer
     * @param {Uint8Array} buffer - Buffer to count bits in
     * @returns {number} Number of set bits
     */
    static countSetBits(buffer: Uint8Array): number;
    /**
     * Convert a buffer to a binary string representation
     * @param {Uint8Array} buffer - Buffer to convert
     * @param {boolean} includeSeparators - Whether to include byte separators
     * @returns {string} Binary string representation
     */
    static toBinaryString(buffer: Uint8Array, includeSeparators?: boolean): string;
    /**
     * Convert a binary string to a buffer
     * @param {string} binaryString - Binary string (without separators)
     * @param {number} byteCount - Expected number of bytes
     * @returns {Uint8Array} Resulting buffer
     */
    static fromBinaryString(binaryString: string, byteCount: number): Uint8Array;
    /**
     * Validate that a bit position is within valid range for a buffer
     * @param {Uint8Array} buffer - Buffer to validate against
     * @param {number} bitPosition - Bit position to validate
     * @throws {Error} If bit position is invalid
     */
    static validateBitPosition(buffer: Uint8Array, bitPosition: number): void;
    /**
     * Get a human-readable representation of specific bit fields
     * @param {Uint8Array} buffer - Buffer to analyze
     * @param {Object} fieldDefinitions - Object mapping field names to {start, length} definitions
     * @returns {Object} Object with field names as keys and their values
     */
    static getFieldValues(buffer: Uint8Array, fieldDefinitions: any): any;
}
//# sourceMappingURL=bit-utils.d.mts.map