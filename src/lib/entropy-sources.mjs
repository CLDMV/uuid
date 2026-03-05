/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /src/lib/entropy-sources.mjs
 *	@Date: 2025-12-15T20:33:49-08:00 (1765859629)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-03-04 21:03:43 -08:00 (1772687023)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Entropy Sources and Validation
 *
 * Provides cryptographically secure entropy sources for UUID generation
 * while ensuring compliance with specification requirements.
 */

import crypto from "crypto";

/**
 * Entropy source and validation utilities
 */
class EntropySource {
	/**
	 * Generate cryptographically secure random bytes
	 * @param {number} byteCount - Number of bytes to generate
	 * @returns {Buffer} Random bytes
	 */
	static generateSecureBytes(byteCount) {
		if (!Number.isInteger(byteCount) || byteCount <= 0) {
			throw new Error("Byte count must be a positive integer");
		}

		// Use Node.js crypto.randomBytes which provides cryptographically secure random data
		return crypto.randomBytes(byteCount);
	}

	/**
	 * Generate entropy for UUID with specified bit requirements
	 * @param {number} entropyBits - Number of entropy bits required
	 * @returns {Buffer} Entropy buffer
	 */
	static generateEntropy(entropyBits) {
		if (!Number.isInteger(entropyBits) || entropyBits <= 0) {
			throw new Error("Entropy bits must be a positive integer");
		}

		const byteCount = Math.ceil(entropyBits / 8);
		return EntropySource.generateSecureBytes(byteCount);
	}

	/**
	 * Calculate required entropy bits using Birthday Bound formula
	 * @param {number} targetCollisionProbability - Target collision probability (e.g., 0.0001 for 0.01%)
	 * @param {number} expectedUUIDs - Expected number of UUIDs to generate
	 * @returns {number} Required entropy bits
	 */
	static calculateRequiredEntropy(targetCollisionProbability, expectedUUIDs) {
		if (targetCollisionProbability <= 0 || targetCollisionProbability >= 1) {
			throw new Error("Target collision probability must be between 0 and 1");
		}

		if (!Number.isInteger(expectedUUIDs) || expectedUUIDs <= 0) {
			throw new Error("Expected UUIDs must be a positive integer");
		}

		// Birthday Bound formula: p ≈ n² / (2 * 2^k)
		// Solving for k: k ≈ log₂(n² / (2 * p))
		const n = expectedUUIDs;
		const p = targetCollisionProbability;

		const requiredBits = Math.log2((n * n) / (2 * p));
		return Math.ceil(requiredBits);
	}

	/**
	 * Validate entropy quality using statistical tests
	 * @param {Buffer} entropy - Entropy to validate
	 * @returns {Object} Validation results
	 */
	static validateEntropyQuality(entropy) {
		const results = {
			byteCount: entropy.length,
			bitCount: entropy.length * 8,
			passed: true,
			tests: {}
		};

		// Test 1: Check for all zeros
		results.tests.allZeros = {
			passed: !entropy.every((byte) => byte === 0),
			description: "Entropy should not be all zeros"
		};

		// Test 2: Check for all ones
		results.tests.allOnes = {
			passed: !entropy.every((byte) => byte === 0xff),
			description: "Entropy should not be all ones"
		};

		// Test 3: Check bit balance (roughly equal 0s and 1s)
		let setBits = 0;
		for (let i = 0; i < entropy.length; i++) {
			let byte = entropy[i];
			while (byte) {
				setBits += byte & 1;
				byte >>= 1;
			}
		}

		const totalBits = entropy.length * 8;
		const balance = setBits / totalBits;
		results.tests.bitBalance = {
			passed: balance >= 0.4 && balance <= 0.6, // Allow 40-60% balance
			value: balance,
			description: "Bit balance should be roughly 50%"
		};

		// Test 4: Check for repeating patterns (simple run test)
		let longestRun = 1;
		let currentRun = 1;
		let lastBit = entropy[0] & 1;

		for (let byteIndex = 0; byteIndex < entropy.length; byteIndex++) {
			for (let bitIndex = byteIndex === 0 ? 1 : 0; bitIndex < 8; bitIndex++) {
				const currentBit = (entropy[byteIndex] >> (7 - bitIndex)) & 1;
				if (currentBit === lastBit) {
					currentRun++;
				} else {
					longestRun = Math.max(longestRun, currentRun);
					currentRun = 1;
					lastBit = currentBit;
				}
			}
		}
		longestRun = Math.max(longestRun, currentRun);

		results.tests.runLength = {
			passed: longestRun <= Math.max(20, Math.log2(totalBits) * 2), // Reasonable run length limit
			value: longestRun,
			description: "Should not have excessively long runs of identical bits"
		};

		// Overall pass/fail
		results.passed = Object.values(results.tests).every((test) => test.passed);

		return results;
	}

	/**
	 * Generate high-quality entropy with validation
	 * @param {number} byteCount - Number of bytes to generate
	 * @param {number} maxAttempts - Maximum number of generation attempts
	 * @returns {Buffer} Validated entropy
	 */
	static generateValidatedEntropy(byteCount, maxAttempts = 10) {
		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			const entropy = EntropySource.generateSecureBytes(byteCount);
			const validation = EntropySource.validateEntropyQuality(entropy);

			if (validation.passed) {
				return entropy;
			}

			console.warn(`Entropy validation failed on attempt ${attempt}:`, validation);
		}

		throw new Error(`Failed to generate valid entropy after ${maxAttempts} attempts`);
	}

	/**
	 * Mix multiple entropy sources together
	 * @param {Array<Buffer>} sources - Array of entropy sources
	 * @returns {Buffer} Mixed entropy
	 */
	static mixEntropySources(sources) {
		if (!Array.isArray(sources) || sources.length === 0) {
			throw new Error("Must provide at least one entropy source");
		}

		if (sources.length === 1) {
			return Buffer.from(sources[0]);
		}

		// Find the maximum length
		const maxLength = Math.max(...sources.map((s) => s.length));

		// XOR all sources together, padding shorter ones with zeros
		const mixed = Buffer.alloc(maxLength, 0);

		for (const source of sources) {
			for (let i = 0; i < source.length; i++) {
				mixed[i] ^= source[i];
			}
		}

		return mixed;
	}

	/**
	 * Create entropy from timestamp with additional randomness
	 * Note: This method ensures the entropy is NOT solely dependent on the timestamp
	 * @param {number|Date} timestamp - Timestamp component
	 * @param {number} additionalBytes - Additional random bytes to mix in
	 * @returns {Buffer} Mixed entropy
	 */
	static createTimestampIndependentEntropy(timestamp, additionalBytes = 16) {
		const timestampMs = timestamp instanceof Date ? timestamp.getTime() : timestamp;

		// Create timestamp component (8 bytes)
		const timestampBuffer = Buffer.allocUnsafe(8);
		timestampBuffer.writeBigUInt64BE(BigInt(timestampMs), 0);

		// Generate additional random entropy
		const randomEntropy = EntropySource.generateSecureBytes(additionalBytes);

		// Hash the combination to ensure good distribution
		const combined = Buffer.concat([timestampBuffer, randomEntropy]);
		const hash = crypto.createHash("sha256").update(combined).digest();

		return hash;
	}

	/**
	 * Estimate entropy in a buffer using Shannon entropy
	 * @param {Buffer} buffer - Buffer to analyze
	 * @returns {number} Estimated entropy in bits
	 */
	static estimateShannnonEntropy(buffer) {
		if (buffer.length === 0) {
			return 0;
		}

		// Count frequency of each byte value
		const frequencies = new Array(256).fill(0);
		for (let i = 0; i < buffer.length; i++) {
			frequencies[buffer[i]]++;
		}

		// Calculate Shannon entropy
		let entropy = 0;
		const totalBytes = buffer.length;

		for (let i = 0; i < 256; i++) {
			if (frequencies[i] > 0) {
				const probability = frequencies[i] / totalBytes;
				entropy -= probability * Math.log2(probability);
			}
		}

		// Return total entropy in bits
		return entropy * buffer.length;
	}

	/**
	 * Check if entropy source appears to be clock-based
	 * @param {Function} entropyGenerator - Function that generates entropy
	 * @param {number} sampleCount - Number of samples to analyze
	 * @returns {Object} Analysis results
	 */
	static analyzeEntropySource(entropyGenerator, sampleCount = 100) {
		const samples = [];
		const timestamps = [];

		for (let i = 0; i < sampleCount; i++) {
			const before = Date.now();
			const entropy = entropyGenerator();
			const after = Date.now();

			samples.push(entropy);
			timestamps.push({ before, after, duration: after - before });

			// Small delay to avoid overwhelming the system
			if (i < sampleCount - 1) {
				const start = Date.now();
				while (Date.now() - start < 1) {
					/* small delay */
				}
			}
		}

		// Analyze for patterns
		const analysis = {
			sampleCount,
			avgGenerationTime: timestamps.reduce((sum, t) => sum + t.duration, 0) / timestamps.length,
			uniqueSamples: new Set(samples.map((s) => s.toString("hex"))).size,
			appearsClockBased: false,
			warnings: []
		};

		// Check for low uniqueness (possible clock dependency)
		const uniquenessRatio = analysis.uniqueSamples / sampleCount;
		if (uniquenessRatio < 0.95) {
			analysis.appearsClockBased = true;
			analysis.warnings.push(`Low uniqueness ratio: ${uniquenessRatio.toFixed(3)}`);
		}

		// Check for consistent generation times (possible clock dependency)
		const timingVariance =
			timestamps.reduce((sum, t) => {
				const diff = t.duration - analysis.avgGenerationTime;
				return sum + diff * diff;
			}, 0) / timestamps.length;

		if (timingVariance < 0.1 && analysis.avgGenerationTime > 0) {
			analysis.warnings.push("Very consistent generation timing may indicate clock dependency");
		}

		return analysis;
	}
}

export { EntropySource };
