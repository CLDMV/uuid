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
	static setBits(buffer, startBit, bitCount, value) {
		if (startBit < 0 || startBit + bitCount > buffer.length * 8) {
			throw new Error(`Invalid bit range: ${startBit}-${startBit + bitCount - 1} for ${buffer.length * 8}-bit buffer`);
		}

		// Calculate max value safely using BigInt
		const maxValue = (BigInt(1) << BigInt(bitCount)) - BigInt(1);
		const bigValue = typeof value === "bigint" ? value : BigInt(value);

		if (bigValue > maxValue || bigValue < 0) {
			throw new Error(`Value ${value} too large for ${bitCount} bits`);
		}

		for (let i = 0; i < bitCount; i++) {
			const bitPos = startBit + i;
			const byteIndex = Math.floor(bitPos / 8);
			const bitInByte = 7 - (bitPos % 8);
			const bitValue = Number((bigValue >> BigInt(bitCount - 1 - i)) & 1n);

			if (bitValue) {
				buffer[byteIndex] |= 1 << bitInByte;
			} else {
				buffer[byteIndex] &= ~(1 << bitInByte);
			}
		}
	}

	/**
	 * Get specific bits from a buffer
	 * @param {Buffer} buffer - Source buffer
	 * @param {number} startBit - Starting bit position (0-based)
	 * @param {number} bitCount - Number of bits to get
	 * @returns {BigInt} The extracted value as BigInt
	 */
	static getBits(buffer, startBit, bitCount) {
		if (startBit < 0 || startBit + bitCount > buffer.length * 8) {
			throw new Error(`Invalid bit range: ${startBit}-${startBit + bitCount - 1} for ${buffer.length * 8}-bit buffer`);
		}

		let result = 0n;
		for (let i = 0; i < bitCount; i++) {
			const bitPos = startBit + i;
			const byteIndex = Math.floor(bitPos / 8);
			const bitInByte = 7 - (bitPos % 8);
			const bitValue = BigInt((buffer[byteIndex] >> bitInByte) & 1);
			result = (result << 1n) | bitValue;
		}

		return result;
	}

	/**
	 * Get specific bits from a buffer as a regular number (for values <= 32 bits)
	 * @param {Buffer} buffer - Source buffer
	 * @param {number} startBit - Starting bit position (0-based)
	 * @param {number} bitCount - Number of bits to get (max 32)
	 * @returns {number} The extracted value as number
	 */
	static getBitsAsNumber(buffer, startBit, bitCount) {
		if (bitCount > 32) {
			throw new Error("Use getBits() for values larger than 32 bits");
		}
		return Number(BitUtils.getBits(buffer, startBit, bitCount));
	}

	/**
	 * Clear specific bits in a buffer
	 * @param {Buffer} buffer - Target buffer
	 * @param {number} startBit - Starting bit position (0-based)
	 * @param {number} bitCount - Number of bits to clear
	 */
	static clearBits(buffer, startBit, bitCount) {
		BitUtils.setBits(buffer, startBit, bitCount, 0);
	}

	/**
	 * Toggle specific bits in a buffer
	 * @param {Buffer} buffer - Target buffer
	 * @param {number} startBit - Starting bit position (0-based)
	 * @param {number} bitCount - Number of bits to toggle
	 */
	static toggleBits(buffer, startBit, bitCount) {
		for (let i = 0; i < bitCount; i++) {
			const bitPos = startBit + i;
			const byteIndex = Math.floor(bitPos / 8);
			const bitInByte = 7 - (bitPos % 8);
			buffer[byteIndex] ^= 1 << bitInByte;
		}
	}

	/**
	 * Create a bit mask for specific bit positions
	 * @param {number} totalBits - Total number of bits in the mask
	 * @param {Array<number>} bitPositions - Array of bit positions to set
	 * @returns {Buffer} Buffer containing the bit mask
	 */
	static createBitMask(totalBits, bitPositions) {
		const byteCount = Math.ceil(totalBits / 8);
		const mask = Buffer.alloc(byteCount, 0);

		for (const bitPos of bitPositions) {
			if (bitPos < 0 || bitPos >= totalBits) {
				throw new Error(`Bit position ${bitPos} out of range (0-${totalBits - 1})`);
			}

			const byteIndex = Math.floor(bitPos / 8);
			const bitInByte = 7 - (bitPos % 8);
			mask[byteIndex] |= 1 << bitInByte;
		}

		return mask;
	}

	/**
	 * Apply a bit mask to a buffer (AND operation)
	 * @param {Buffer} buffer - Target buffer to modify
	 * @param {Buffer} mask - Bit mask to apply
	 */
	static applyMask(buffer, mask) {
		if (buffer.length !== mask.length) {
			throw new Error("Buffer and mask must be the same length");
		}

		for (let i = 0; i < buffer.length; i++) {
			buffer[i] &= mask[i];
		}
	}

	/**
	 * Apply an inverted bit mask to a buffer (clear masked bits)
	 * @param {Buffer} buffer - Target buffer to modify
	 * @param {Buffer} mask - Bit mask to invert and apply
	 */
	static applyInvertedMask(buffer, mask) {
		if (buffer.length !== mask.length) {
			throw new Error("Buffer and mask must be the same length");
		}

		for (let i = 0; i < buffer.length; i++) {
			buffer[i] &= ~mask[i];
		}
	}

	/**
	 * Count the number of set bits in a buffer
	 * @param {Buffer} buffer - Buffer to count bits in
	 * @returns {number} Number of set bits
	 */
	static countSetBits(buffer) {
		let count = 0;
		for (let i = 0; i < buffer.length; i++) {
			let byte = buffer[i];
			while (byte) {
				count += byte & 1;
				byte >>= 1;
			}
		}
		return count;
	}

	/**
	 * Convert a buffer to a binary string representation
	 * @param {Buffer} buffer - Buffer to convert
	 * @param {boolean} includeSeparators - Whether to include byte separators
	 * @returns {string} Binary string representation
	 */
	static toBinaryString(buffer, includeSeparators = false) {
		const binaryBytes = [];
		for (let i = 0; i < buffer.length; i++) {
			binaryBytes.push(buffer[i].toString(2).padStart(8, "0"));
		}
		return includeSeparators ? binaryBytes.join(" ") : binaryBytes.join("");
	}

	/**
	 * Convert a binary string to a buffer
	 * @param {string} binaryString - Binary string (without separators)
	 * @param {number} byteCount - Expected number of bytes
	 * @returns {Buffer} Resulting buffer
	 */
	static fromBinaryString(binaryString, byteCount) {
		const cleanBinary = binaryString.replace(/\s/g, ""); // Remove any spaces

		if (cleanBinary.length !== byteCount * 8) {
			throw new Error(`Binary string length ${cleanBinary.length} doesn't match expected ${byteCount * 8} bits`);
		}

		const buffer = Buffer.alloc(byteCount);
		for (let i = 0; i < byteCount; i++) {
			const byteString = cleanBinary.slice(i * 8, (i + 1) * 8);
			buffer[i] = parseInt(byteString, 2);
		}

		return buffer;
	}

	/**
	 * Validate that a bit position is within valid range for a buffer
	 * @param {Buffer} buffer - Buffer to validate against
	 * @param {number} bitPosition - Bit position to validate
	 * @throws {Error} If bit position is invalid
	 */
	static validateBitPosition(buffer, bitPosition) {
		const maxBit = buffer.length * 8 - 1;
		if (bitPosition < 0 || bitPosition > maxBit) {
			throw new Error(`Bit position ${bitPosition} out of range (0-${maxBit})`);
		}
	}

	/**
	 * Get a human-readable representation of specific bit fields
	 * @param {Buffer} buffer - Buffer to analyze
	 * @param {Object} fieldDefinitions - Object mapping field names to {start, length} definitions
	 * @returns {Object} Object with field names as keys and their values
	 */
	static getFieldValues(buffer, fieldDefinitions) {
		const result = {};

		for (const [fieldName, definition] of Object.entries(fieldDefinitions)) {
			const { start, length } = definition;
			result[fieldName] = BitUtils.getBitsAsNumber(buffer, start, length);
		}

		return result;
	}
}
