/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /tests/entropy-sources.test.vitest.mjs
 *	@Date: 2026-03-04 20:28:46 -08:00 (1772684926)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-03-04 21:04:03 -08:00 (1772687043)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Entropy Source Test Suite
 *
 * Covers entropy generation, validation, and analysis utilities.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { EntropySource } from "../src/lib/entropy-sources.mjs";

afterEach(() => {
	vi.restoreAllMocks();
});

describe("EntropySource.generateSecureBytes", () => {
	it("should generate requested number of random bytes", () => {
		const bytes = EntropySource.generateSecureBytes(16);
		expect(Buffer.isBuffer(bytes)).toBe(true);
		expect(bytes.length).toBe(16);
	});

	it("should reject invalid byte counts", () => {
		expect(() => EntropySource.generateSecureBytes(0)).toThrow(/positive integer/);
		expect(() => EntropySource.generateSecureBytes(-1)).toThrow(/positive integer/);
		expect(() => EntropySource.generateSecureBytes(1.5)).toThrow(/positive integer/);
	});
});

describe("EntropySource.generateEntropy", () => {
	it("should round bit requirements up to byte count", () => {
		const entropy = EntropySource.generateEntropy(130);
		expect(entropy.length).toBe(17);
	});

	it("should reject invalid entropy bit requests", () => {
		expect(() => EntropySource.generateEntropy(0)).toThrow(/positive integer/);
		expect(() => EntropySource.generateEntropy(-8)).toThrow(/positive integer/);
	});
});

describe("EntropySource.calculateRequiredEntropy", () => {
	it("should compute a positive entropy requirement", () => {
		const required = EntropySource.calculateRequiredEntropy(0.0001, 1_000_000);
		expect(required).toBeGreaterThan(0);
		expect(Number.isInteger(required)).toBe(true);
	});

	it("should reject invalid collision probability and expected UUIDs", () => {
		expect(() => EntropySource.calculateRequiredEntropy(0, 100)).toThrow(/between 0 and 1/);
		expect(() => EntropySource.calculateRequiredEntropy(1, 100)).toThrow(/between 0 and 1/);
		expect(() => EntropySource.calculateRequiredEntropy(0.5, 0)).toThrow(/positive integer/);
	});
});

describe("EntropySource.validateEntropyQuality", () => {
	it("should fail all-zero entropy", () => {
		const result = EntropySource.validateEntropyQuality(Buffer.alloc(16, 0));
		expect(result.tests.allZeros.passed).toBe(false);
		expect(result.passed).toBe(false);
	});

	it("should fail all-ones entropy", () => {
		const result = EntropySource.validateEntropyQuality(Buffer.alloc(16, 0xff));
		expect(result.tests.allOnes.passed).toBe(false);
		expect(result.passed).toBe(false);
	});

	it("should report bit-balance and run-length metrics", () => {
		const patterned = Buffer.from([0xaa, 0x55, 0xaa, 0x55, 0xaa, 0x55, 0xaa, 0x55]);
		const result = EntropySource.validateEntropyQuality(patterned);
		expect(result.tests.bitBalance.value).toBeGreaterThan(0);
		expect(result.tests.bitBalance.value).toBeLessThan(1);
		expect(result.tests.runLength.value).toBeGreaterThan(0);
	});
});

describe("EntropySource.generateValidatedEntropy", () => {
	it("should return entropy when validation passes", () => {
		const entropy = EntropySource.generateValidatedEntropy(16, 2);
		expect(entropy.length).toBe(16);
	});

	it("should throw when all validation attempts fail", () => {
		vi.spyOn(EntropySource, "generateSecureBytes").mockReturnValue(Buffer.alloc(8, 0));
		vi.spyOn(EntropySource, "validateEntropyQuality").mockReturnValue({
			passed: false,
			tests: {}
		});
		expect(() => EntropySource.generateValidatedEntropy(8, 2)).toThrow(/after 2 attempts/);
	});
});

describe("EntropySource.mixEntropySources", () => {
	it("should reject invalid source arrays", () => {
		expect(() => EntropySource.mixEntropySources([])).toThrow(/at least one entropy source/);
		expect(() => EntropySource.mixEntropySources(null)).toThrow(/at least one entropy source/);
	});

	it("should return a copy when a single source is provided", () => {
		const source = Buffer.from([1, 2, 3]);
		const mixed = EntropySource.mixEntropySources([source]);
		expect(mixed.equals(source)).toBe(true);
		expect(mixed).not.toBe(source);
	});

	it("should XOR multiple sources and preserve max length", () => {
		const mixed = EntropySource.mixEntropySources([Buffer.from([0xff, 0x00, 0x0f]), Buffer.from([0x0f, 0xf0])]);
		expect(mixed.length).toBe(3);
		expect([...mixed]).toEqual([0xf0, 0xf0, 0x0f]);
	});
});

describe("EntropySource timestamp and analysis utilities", () => {
	it("should create timestamp-independent entropy from Date and number", () => {
		const fromDate = EntropySource.createTimestampIndependentEntropy(new Date("2024-01-01T00:00:00.000Z"));
		const fromNumber = EntropySource.createTimestampIndependentEntropy(1704067200000);
		expect(fromDate.length).toBe(32);
		expect(fromNumber.length).toBe(32);
	});

	it("should estimate Shannon entropy for empty and non-empty buffers", () => {
		expect(EntropySource.estimateShannnonEntropy(Buffer.alloc(0))).toBe(0);
		const entropy = EntropySource.estimateShannnonEntropy(Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]));
		expect(entropy).toBeGreaterThan(0);
	});

	it("should analyze source and flag low uniqueness", () => {
		const deterministicGenerator = () => Buffer.from([0, 1, 2, 3]);
		const analysis = EntropySource.analyzeEntropySource(deterministicGenerator, 5);
		expect(analysis.sampleCount).toBe(5);
		expect(analysis.uniqueSamples).toBe(1);
		expect(analysis.appearsClockBased).toBe(true);
		expect(analysis.warnings.length).toBeGreaterThan(0);
	});

	it("should warn when generation timing is very consistent", () => {
		let now = 1_000;
		vi.spyOn(Date, "now").mockImplementation(() => now++);

		const uniqueGenerator = (() => {
			let counter = 0;
			return () => Buffer.from([counter++, 1, 2, 3]);
		})();

		const analysis = EntropySource.analyzeEntropySource(uniqueGenerator, 5);
		expect(analysis.avgGenerationTime).toBeGreaterThan(0);
		expect(analysis.warnings.some((warning) => warning.includes("Very consistent generation timing"))).toBe(true);
	});
});
