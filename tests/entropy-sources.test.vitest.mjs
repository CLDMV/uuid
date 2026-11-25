/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /tests/entropy-sources.test.vitest.mjs
 *	@Date: 2026-03-04T20:28:46-08:00 (1772684926)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T15:33:36-07:00 (1790980416)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * Entropy Source Test Suite
 *
 * Covers entropy generation, validation, and analysis utilities.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { createHash } from "node:crypto";
import { EntropySource } from "@cldmv/uuid/entropy";

afterEach(() => {
	vi.restoreAllMocks();
});

describe("EntropySource.generateSecureBytes", () => {
	it("should generate requested number of random bytes", () => {
		const bytes = EntropySource.generateSecureBytes(16);
		expect(bytes).toBeInstanceOf(Uint8Array);
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

	it("should scale the bit-balance window with input length", () => {
		// 4 standard deviations: sqrt(n)/2 per sigma, so 2*sqrt(n) set bits either side of n/2.
		const short = EntropySource.validateEntropyQuality(new Uint8Array(16).fill(0xaa));
		expect(short.tests.bitBalance.min).toBeCloseTo(0.5 - (2 * Math.sqrt(128)) / 128, 10);
		expect(short.tests.bitBalance.max).toBeCloseTo(0.5 + (2 * Math.sqrt(128)) / 128, 10);
		const long = EntropySource.validateEntropyQuality(new Uint8Array(4096).fill(0xaa));
		expect(long.tests.bitBalance.max - long.tests.bitBalance.min).toBeLessThan(short.tests.bitBalance.max - short.tests.bitBalance.min);
	});

	it("should accept a 16-byte draw at 37.5% set bits that the old 40-60% window rejected", () => {
		// 48 of 128 bits set (0x0f has 4 of 8; 0x03 has 2), all runs short.
		const bytes = new Uint8Array([0x0f, 0x0f, 0x0f, 0x0f, 0x0f, 0x0f, 0x0f, 0x0f, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03]);
		const result = EntropySource.validateEntropyQuality(bytes);
		expect(result.tests.bitBalance.value).toBe(0.375);
		expect(result.tests.bitBalance.passed).toBe(true);
	});

	it("should reject a large input whose bit balance is far off half", () => {
		// 0x07 sets 3 of 8 bits: 37.5%, which is many standard deviations out at 32768 bits.
		const result = EntropySource.validateEntropyQuality(new Uint8Array(4096).fill(0x07));
		expect(result.tests.bitBalance.passed).toBe(false);
		expect(result.passed).toBe(false);
	});

	it("should handle an empty input", () => {
		const result = EntropySource.validateEntropyQuality(new Uint8Array(0));
		expect(result.bitCount).toBe(0);
		expect(result.passed).toBe(false);
	});
});

describe("EntropySource.generateValidatedEntropy", () => {
	// Fixed bytes keep these tests deterministic: real random bytes fail the bit-balance check
	// now and then by design.
	it("should return entropy when validation passes", () => {
		const good = Buffer.alloc(16, 0xaa); // alternating bits: 50% balance, runs of 1
		const generate = vi.spyOn(EntropySource, "generateSecureBytes").mockReturnValue(good);
		const entropy = EntropySource.generateValidatedEntropy(16, 2);
		expect(entropy).toBe(good);
		expect(generate).toHaveBeenCalledTimes(1);
	});

	it("should retry until an attempt passes validation", () => {
		const bad = Buffer.alloc(16, 0);
		const good = Buffer.alloc(16, 0xaa);
		const generate = vi.spyOn(EntropySource, "generateSecureBytes").mockReturnValueOnce(bad).mockReturnValueOnce(good);
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const entropy = EntropySource.generateValidatedEntropy(16, 2);
		expect(entropy).toBe(good);
		expect(generate).toHaveBeenCalledTimes(2);
		expect(warn).toHaveBeenCalledTimes(1);
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
		expect([...mixed]).toEqual([1, 2, 3]);
		expect(mixed).not.toBe(source);
		mixed[0] = 99;
		expect(source[0]).toBe(1);
	});

	it("should XOR multiple sources and preserve max length", () => {
		const mixed = EntropySource.mixEntropySources([Buffer.from([0xff, 0x00, 0x0f]), Buffer.from([0x0f, 0xf0])]);
		expect(mixed).toBeInstanceOf(Uint8Array);
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

	it("should hash the 9-byte two's-complement timestamp followed by the random bytes", () => {
		const random = new Uint8Array(16).fill(0x5a);
		vi.spyOn(EntropySource, "generateSecureBytes").mockReturnValue(random);
		const message = new Uint8Array(25);
		message.set([0x00, 0x00, 0x00, 0x01, 0x8c, 0xc2, 0x51, 0xf4, 0x00], 0); // 1704067200000 = 0x18cc251f400
		message.set(random, 9);
		const expected = createHash("sha256").update(message).digest("hex");
		const digest = EntropySource.createTimestampIndependentEntropy(1704067200000);
		expect(Buffer.from(digest).toString("hex")).toBe(expected);
	});

	it("should estimate Shannon entropy for empty and non-empty buffers", () => {
		expect(EntropySource.estimateShannonEntropy(new Uint8Array(0))).toBe(0);
		const entropy = EntropySource.estimateShannonEntropy(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]));
		// 8 distinct values: 3 bits per byte, 24 bits in all
		expect(entropy).toBe(24);
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
