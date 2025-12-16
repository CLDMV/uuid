/**
 * Vitest Test Suite for Bit Manipulation Utilities
 *
 * Comprehensive tests for the BitUtils class covering all bit manipulation operations.
 */

import { describe, test, expect } from "vitest";
import { BitUtils } from "../src/lib/bit-utils.mjs";

describe("BitUtils", () => {
	test("should set and get single bits correctly", () => {
		const buffer = Buffer.alloc(2, 0); // 16 bits, all zeros

		// Set bit 0
		BitUtils.setBits(buffer, 0, 1, 1);
		expect(BitUtils.getBitsAsNumber(buffer, 0, 1)).toBe(1);

		// Set bit 15 (last bit)
		BitUtils.setBits(buffer, 15, 1, 1);
		expect(BitUtils.getBitsAsNumber(buffer, 15, 1)).toBe(1);

		// Verify bit 1 is still 0
		expect(BitUtils.getBitsAsNumber(buffer, 1, 1)).toBe(0);
	});

	test("should handle multi-bit values", () => {
		const buffer = Buffer.alloc(4, 0); // 32 bits

		// Set 8 bits to 255
		BitUtils.setBits(buffer, 0, 8, 255);
		expect(BitUtils.getBitsAsNumber(buffer, 0, 8)).toBe(255);

		// Set 4 bits to 15
		BitUtils.setBits(buffer, 8, 4, 15);
		expect(BitUtils.getBitsAsNumber(buffer, 8, 4)).toBe(15);

		// Set 10 bits to 1023
		BitUtils.setBits(buffer, 16, 10, 1023);
		expect(BitUtils.getBitsAsNumber(buffer, 16, 10)).toBe(1023);
	});

	test("should handle cross-byte boundaries", () => {
		const buffer = Buffer.alloc(3, 0); // 24 bits

		// Set bits that cross byte boundary (bits 6-9, spanning bytes 0 and 1)
		BitUtils.setBits(buffer, 6, 4, 12); // 1100 in binary
		expect(BitUtils.getBitsAsNumber(buffer, 6, 4)).toBe(12);

		// Verify individual bytes have correct patterns
		expect(buffer[0]).toBe(0b00000011); // Last 2 bits set
		expect(buffer[1]).toBe(0b00000000); // First 2 bits cleared
	});

	test("should handle large values with BigInt", () => {
		const buffer = Buffer.alloc(16, 0); // 128 bits

		// Set a large 64-bit value
		const largeValue = 0xffffffffffffffffn;
		BitUtils.setBits(buffer, 0, 64, largeValue);

		const retrieved = BitUtils.getBits(buffer, 0, 64);
		expect(retrieved).toBe(largeValue);
	});

	test("should convert between BigInt and Number appropriately", () => {
		const buffer = Buffer.alloc(8, 0);

		// Small value should work with getBitsAsNumber
		BitUtils.setBits(buffer, 0, 16, 65535);
		expect(BitUtils.getBitsAsNumber(buffer, 0, 16)).toBe(65535);

		// Large value should require getBits (returns BigInt)
		BitUtils.setBits(buffer, 0, 40, 0xffffffffffn);
		expect(BitUtils.getBits(buffer, 0, 40)).toBe(0xffffffffffn);
	});

	test("should throw error for getBitsAsNumber with >32 bits", () => {
		const buffer = Buffer.alloc(8, 0);
		expect(() => BitUtils.getBitsAsNumber(buffer, 0, 33)).toThrow(/Use getBits.*32 bits/);
	});

	test("should validate bit ranges", () => {
		const buffer = Buffer.alloc(2, 0); // 16 bits

		// Valid ranges should not throw
		expect(() => BitUtils.setBits(buffer, 0, 1, 1)).not.toThrow();
		expect(() => BitUtils.setBits(buffer, 15, 1, 1)).not.toThrow();
		expect(() => BitUtils.setBits(buffer, 0, 16, 65535)).not.toThrow();

		// Invalid ranges should throw
		expect(() => BitUtils.setBits(buffer, -1, 1, 1)).toThrow(/Invalid bit range/);
		expect(() => BitUtils.setBits(buffer, 16, 1, 1)).toThrow(/Invalid bit range/);
		expect(() => BitUtils.setBits(buffer, 10, 10, 1)).toThrow(/Invalid bit range/);
	});

	test("should validate value ranges", () => {
		const buffer = Buffer.alloc(2, 0);

		// Valid values
		expect(() => BitUtils.setBits(buffer, 0, 8, 255)).not.toThrow();
		expect(() => BitUtils.setBits(buffer, 0, 10, 1023)).not.toThrow();

		// Invalid values (too large for bit count)
		expect(() => BitUtils.setBits(buffer, 0, 8, 256)).toThrow(/too large/);
		expect(() => BitUtils.setBits(buffer, 0, 10, 1024)).toThrow(/too large/);

		// Negative values
		expect(() => BitUtils.setBits(buffer, 0, 8, -1)).toThrow(/too large/);
	});

	test("should clear bits correctly", () => {
		const buffer = Buffer.alloc(2, 0xff); // All bits set

		BitUtils.clearBits(buffer, 0, 8);
		expect(BitUtils.getBitsAsNumber(buffer, 0, 8)).toBe(0);
		expect(BitUtils.getBitsAsNumber(buffer, 8, 8)).toBe(255); // Other bits unchanged
	});

	test("should toggle bits correctly", () => {
		const buffer = Buffer.alloc(2, 0);

		BitUtils.setBits(buffer, 0, 8, 0b10101010);
		BitUtils.toggleBits(buffer, 0, 8);
		expect(BitUtils.getBitsAsNumber(buffer, 0, 8)).toBe(0b01010101);
	});

	test("should create bit masks correctly", () => {
		const mask = BitUtils.createBitMask(16, [0, 3, 7, 15]);

		expect(BitUtils.getBitsAsNumber(mask, 0, 1)).toBe(1);
		expect(BitUtils.getBitsAsNumber(mask, 3, 1)).toBe(1);
		expect(BitUtils.getBitsAsNumber(mask, 7, 1)).toBe(1);
		expect(BitUtils.getBitsAsNumber(mask, 15, 1)).toBe(1);
		expect(BitUtils.getBitsAsNumber(mask, 1, 1)).toBe(0);
	});

	test("should apply masks correctly", () => {
		const buffer = Buffer.alloc(2, 0xff);
		const mask = BitUtils.createBitMask(16, [0, 1, 2, 3]);

		BitUtils.applyMask(buffer, mask);
		expect(BitUtils.getBitsAsNumber(buffer, 0, 4)).toBe(15);
		expect(BitUtils.getBitsAsNumber(buffer, 4, 12)).toBe(0);
	});

	test("should apply inverted masks correctly", () => {
		const buffer = Buffer.alloc(2, 0xff);
		const mask = BitUtils.createBitMask(16, [0, 1, 2, 3]);

		BitUtils.applyInvertedMask(buffer, mask);
		expect(BitUtils.getBitsAsNumber(buffer, 0, 4)).toBe(0);
		expect(BitUtils.getBitsAsNumber(buffer, 4, 12)).toBe(0xfff);
	});

	test("should count set bits correctly", () => {
		const buffer = Buffer.alloc(2, 0);

		BitUtils.setBits(buffer, 0, 16, 0b1010101010101010);
		expect(BitUtils.countSetBits(buffer)).toBe(8);

		const buffer2 = Buffer.alloc(2, 0xff);
		expect(BitUtils.countSetBits(buffer2)).toBe(16);
	});

	test("should convert to binary string", () => {
		const buffer = Buffer.from([0b10101010, 0b01010101]);

		const binary = BitUtils.toBinaryString(buffer, false);
		expect(binary).toBe("1010101001010101");

		const binaryWithSep = BitUtils.toBinaryString(buffer, true);
		expect(binaryWithSep).toBe("10101010 01010101");
	});

	test("should convert from binary string", () => {
		const binaryString = "1010101001010101";
		const buffer = BitUtils.fromBinaryString(binaryString, 2);

		expect(buffer[0]).toBe(0b10101010);
		expect(buffer[1]).toBe(0b01010101);
	});

	test("should get field values from definitions", () => {
		const buffer = Buffer.alloc(16, 0);
		BitUtils.setBits(buffer, 64, 3, 0b111);
		BitUtils.setBits(buffer, 67, 2, 0b01);
		BitUtils.setBits(buffer, 75, 4, 5);

		const fields = BitUtils.getFieldValues(buffer, {
			variant: { start: 64, length: 3 },
			subvariant: { start: 67, length: 2 },
			version: { start: 75, length: 4 }
		});

		expect(fields.variant).toBe(7);
		expect(fields.subvariant).toBe(1);
		expect(fields.version).toBe(5);
	});
});
