/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /src/lib/entropy-sources.mjs
 *	@Date: 2025-12-15T20:33:49-08:00 (1765859629)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-21T12:52:12-08:00 (1795294332)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * Entropy helpers, published as `@cldmv/uuid/entropy`.
 *
 * Secure random bytes, the birthday-bound math for sizing an id's random field, quick sanity
 * checks on a byte source, XOR mixing, a timestamp-plus-random digest and a Shannon estimate.
 * Everything works on `Uint8Array` (a Node `Buffer` is one, so Buffers work as inputs) and
 * runs in browsers: bytes come from `@cldmv/uuid/rng`, hex from `@cldmv/uuid/bytes` and
 * SHA-256 from `@cldmv/uuid/hash`, each of which has a browser variant.
 */

import { randomBytes } from "@cldmv/uuid/rng";
import { toHex } from "@cldmv/uuid/bytes";
import { sha256 } from "@cldmv/uuid/hash";
import { toTimestampBigInt } from "./timestamp.mjs";

/**
 * How many standard deviations the set-bit count may stray from half before
 * validateEntropyQuality flags it. At 4, a fair source is flagged about once in 16,000 checks
 * at any length.
 */
const BIT_BALANCE_SIGMAS = 4;

/**
 * Entropy source and validation utilities
 */
class EntropySource {
	/**
	 * Generate cryptographically secure random bytes
	 * @param {number} byteCount - Number of bytes to generate
	 * @returns {Uint8Array} Random bytes
	 */
	static generateSecureBytes(byteCount) {
		if (!Number.isInteger(byteCount) || byteCount <= 0) {
			throw new Error("Byte count must be a positive integer");
		}

		return randomBytes(byteCount);
	}

	/**
	 * Generate at least the given number of random bits, rounded up to whole bytes
	 * @param {number} entropyBits - Number of entropy bits required
	 * @returns {Uint8Array} Random bytes
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
	 * Sanity-check a byte source: not all zeros, not all ones, a set-bit count within
	 * 4 standard deviations of half, and no excessively long run of one bit value. These
	 * catch a broken or stuck source; they are not a randomness proof.
	 * @param {Uint8Array} entropy - Bytes to check
	 * @returns {{byteCount: number, bitCount: number, passed: boolean, tests: Record<string, {passed: boolean, value?: number, min?: number, max?: number, description: string}>}} Validation results
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

		// Test 3: Bit balance. For n fair bits the set-bit count has mean n/2 and standard
		// deviation sqrt(n)/2, so the allowed share narrows as the input grows.
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
		const tolerance = totalBits ? (BIT_BALANCE_SIGMAS * Math.sqrt(totalBits)) / 2 / totalBits : 0;
		results.tests.bitBalance = {
			passed: Math.abs(balance - 0.5) <= tolerance,
			value: balance,
			min: Math.max(0, 0.5 - tolerance),
			max: Math.min(1, 0.5 + tolerance),
			description: "Share of set bits should be within 4 standard deviations of 50%"
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
	 * Generate random bytes that pass validateEntropyQuality, retrying up to maxAttempts times
	 * @param {number} byteCount - Number of bytes to generate
	 * @param {number} [maxAttempts=10] - Maximum number of generation attempts
	 * @returns {Uint8Array} Validated random bytes
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
	 * XOR several byte sources together; shorter sources are padded with zeros
	 * @param {Array<Uint8Array>} sources - Byte sources to mix
	 * @returns {Uint8Array} Mixed bytes, as long as the longest source
	 */
	static mixEntropySources(sources) {
		if (!Array.isArray(sources) || sources.length === 0) {
			throw new Error("Must provide at least one entropy source");
		}

		const maxLength = Math.max(...sources.map((s) => s.length));
		const mixed = new Uint8Array(maxLength);

		for (const source of sources) {
			for (let i = 0; i < source.length; i++) {
				mixed[i] ^= source[i];
			}
		}

		return mixed;
	}

	/**
	 * SHA-256 of a timestamp plus fresh random bytes, so the result never depends on the
	 * timestamp alone
	 * @param {number|bigint|string|Date} timestamp - Timestamp component (milliseconds for a Date); any whole number within ±(2^69 - 1)
	 * @param {number} [additionalBytes=16] - Random bytes to mix in
	 * @returns {Uint8Array} 32-byte digest
	 */
	static createTimestampIndependentEntropy(timestamp, additionalBytes = 16) {
		// Timestamp component: 9 bytes, two's complement, which holds the whole 70-bit range including negatives
		let encoded = BigInt.asUintN(72, toTimestampBigInt(timestamp, "ms"));
		const randomEntropy = EntropySource.generateSecureBytes(additionalBytes);
		const combined = new Uint8Array(9 + randomEntropy.length);
		for (let i = 8; i >= 0; i--) {
			combined[i] = Number(encoded & 0xffn);
			encoded >>= 8n;
		}
		combined.set(randomEntropy, 9);

		return sha256(combined);
	}

	/**
	 * Estimate the information in a byte string from its byte-value frequencies (Shannon
	 * entropy per byte times the length). Short inputs underestimate: n bytes can show at
	 * most log2(n) bits per byte.
	 * @param {Uint8Array} buffer - Bytes to analyze
	 * @returns {number} Estimated entropy in bits
	 */
	static estimateShannonEntropy(buffer) {
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
	 * Sample a generator and flag signs that it depends on the clock (repeated outputs,
	 * suspiciously even timing)
	 * @param {() => Uint8Array} entropyGenerator - Function that returns a fresh byte array per call
	 * @param {number} [sampleCount=100] - Number of samples to take
	 * @returns {{sampleCount: number, avgGenerationTime: number, uniqueSamples: number, appearsClockBased: boolean, warnings: string[]}} Analysis results
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
			uniqueSamples: new Set(samples.map((s) => toHex(s))).size,
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
