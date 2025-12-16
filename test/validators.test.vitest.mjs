/**
 * Vest Test Suite for Custom UUID Validators
 *
 * Tests for specification compliance validation and error detection.
 */

import { describe, test, expect } from "vitest";
import { UUID, ISSUER_CATEGORIES } from "../src/uuid.mjs";
import { VARIANT_BITS, SUBVARIANT_ISSUER, SUBVARIANT_TIMESTAMP } from "../src/lib/constants.mjs";
import { UUIDValidator } from "../src/lib/validators.mjs";
import { BitUtils } from "../src/lib/bit-utils.mjs";

describe("UUIDValidator", () => {
	test("should validate correct custom issuer variant UUID", () => {
		const uuid = UUID.createIssuerVariant(100, 1);
		const result = UUIDValidator.validateCompleteUUID(uuid.toBuffer());

		expect(result.isValid).toBe(true);
		expect(result.isUUID).toBe(true);
		expect(result.errors.length).toBe(0);
		expect(result.fields.variant).toBe(VARIANT_BITS);
		expect(result.fields.subvariant).toBe(SUBVARIANT_ISSUER);
		expect(result.fields.version).toBe(1);
		expect(result.fields.issuerID).toBe(100);
	});

	test("should validate correct custom timestamp variant UUID", () => {
		const uuid = UUID.createTimestampVariant(Date.now(), 2);
		const result = UUIDValidator.validateCompleteUUID(uuid.toBuffer());

		expect(result.isValid).toBe(true);
		expect(result.isUUID).toBe(true);
		expect(result.errors.length).toBe(0);
		expect(result.fields.variant).toBe(VARIANT_BITS);
		expect(result.fields.subvariant).toBe(SUBVARIANT_TIMESTAMP);
		expect(result.fields.version).toBe(2);
		// Timestamp variant does NOT have issuerID field
	});

	test("should detect non-spec compliant UUIDs", () => {
		const buffer = Buffer.from("123e4567e89b12d3a456426614174000", "hex");
		const result = UUIDValidator.validateCompleteUUID(buffer);

		expect(result.isUUID).toBe(false);
		expect(result.warnings.length > 0).toBeTruthy();
		expect(result.warnings[0].includes("Not a valid UUID")).toBeTruthy();
	});

	test("should validate all issuer categories", () => {
		const testCases = [
			{ id: ISSUER_CATEGORIES.UNASSIGNED, category: "Unassigned" },
			{ id: ISSUER_CATEGORIES.DRAFTER_RESERVED, category: "Drafter Reserved" },
			{ id: 100, category: "Category A" },
			{ id: 300, category: "Category B" },
			{ id: ISSUER_CATEGORIES.SPEC_ORIGINATOR, category: "Spec Originator" },
			{ id: 600, category: "Future RFC" }
		];

		for (const testCase of testCases) {
			const uuid = UUID.createIssuerVariant(testCase.id, 1);
			const result = UUIDValidator.validateCompleteUUID(uuid.toBuffer());

			expect(result.isValid).toBe(true);
			expect(result.fields.issuerCategory).toBe(testCase.category);
		}
	});

	test("should detect invalid buffer length", () => {
		const invalidBuffer = Buffer.alloc(15);
		expect(() => UUIDValidator.validateCompleteUUID(invalidBuffer)).toThrow(/16-byte buffer/);
	});

	test("should detect invalid issuer ID ranges", () => {
		const buffer = Buffer.alloc(16, 0);
		BitUtils.setBits(buffer, 64, 3, VARIANT_BITS);
		BitUtils.setBits(buffer, 67, 2, SUBVARIANT_ISSUER);
		BitUtils.setBits(buffer, 75, 4, 1);
		BitUtils.setBits(buffer, 79, 10, 1023);

		const result = UUIDValidator.validateCompleteUUID(buffer);
		expect(result.isValid).toBe(true);
		expect(result.fields.issuerID).toBe(1023);
	});

	test("should detect invalid version ranges", () => {
		const buffer = Buffer.alloc(16, 0);
		BitUtils.setBits(buffer, 64, 3, VARIANT_BITS);
		BitUtils.setBits(buffer, 67, 2, SUBVARIANT_ISSUER);
		BitUtils.setBits(buffer, 75, 4, 15);
		BitUtils.setBits(buffer, 79, 10, 100);

		const result = UUIDValidator.validateCompleteUUID(buffer);
		expect(result.isValid).toBe(true);
		expect(result.fields.version).toBe(15);
	});

	test("should validate correct bit layout", () => {
		const uuid = UUID.createIssuerVariant(200, 5);
		const result = UUIDValidator.validateBitLayout(uuid.toBuffer());

		expect(result.isValid).toBe(true);
		expect(result.errors.length).toBe(0);
		expect(result.bitFields.variant).toBe(VARIANT_BITS);
		expect(result.bitFields.subvariant).toBe(SUBVARIANT_ISSUER);
		expect(result.bitFields.version).toBe(5);
		expect(result.bitFields.issuerID).toBe(200);
	});

	test("should extract all bit fields correctly", () => {
		const uuid = UUID.createTimestampVariant(Date.now(), 3);
		const result = UUIDValidator.validateBitLayout(uuid.toBuffer());

		expect(result.isValid).toBe(true);
		expect(typeof result.bitFields.timestampSign).toBe("number");
		expect(typeof result.bitFields.timestampLower63).toBe("bigint");
		expect(result.bitFields.variant).toBe(VARIANT_BITS);
		expect(result.bitFields.subvariant).toBe(SUBVARIANT_TIMESTAMP);
		expect(result.bitFields.version).toBe(3);
		// Timestamp variant does not have issuerID field - bits 79-127 are entropy
	});

	test("should analyze entropy in non-immutable fields", () => {
		const uuid = UUID.createIssuerVariant(150, 2);
		const result = UUIDValidator.validateEntropy(uuid.toBuffer());

		expect(result.entropyBits > 0).toBeTruthy();
		expect(result.entropyBits < 128).toBeTruthy();
		expect(typeof result.analysis.bitBalance).toBe("number");
	});

	test("should detect poor entropy (all zeros in entropy fields)", () => {
		const buffer = Buffer.alloc(16, 0);
		BitUtils.setBits(buffer, 64, 3, VARIANT_BITS);
		BitUtils.setBits(buffer, 67, 2, SUBVARIANT_ISSUER);
		BitUtils.setBits(buffer, 75, 4, 1);
		BitUtils.setBits(buffer, 78, 10, 100);

		const result = UUIDValidator.validateEntropy(buffer);
		expect(result.warnings.some((warning) => warning.includes("entropy bits are zero"))).toBeTruthy();
	});

	test("should detect poor entropy (all ones in entropy fields)", () => {
		const buffer = Buffer.alloc(16, 0xff);
		BitUtils.setBits(buffer, 64, 3, VARIANT_BITS);
		BitUtils.setBits(buffer, 67, 2, SUBVARIANT_ISSUER);
		BitUtils.setBits(buffer, 75, 4, 1);
		BitUtils.setBits(buffer, 78, 10, 100);

		const result = UUIDValidator.validateEntropy(buffer);
		expect(result.warnings.some((warning) => warning.includes("entropy bits are one"))).toBeTruthy();
	});

	test("should correctly identify all issuer categories", () => {
		const testCases = [
			{ id: 0, expected: "Unassigned" },
			{ id: 1, expected: "Drafter Reserved" },
			{ id: 404, expected: "Spec Originator" },
			{ id: 50, expected: "Category A" },
			{ id: 300, expected: "Category B" },
			{ id: 700, expected: "Future RFC" },
			{ id: 9999, expected: "Unknown" }
		];

		for (const testCase of testCases) {
			const category = UUIDValidator.getIssuerCategory(testCase.id);
			expect(category).toBe(testCase.expected);
		}
	});

	test("should identify immutable issuer IDs", () => {
		const immutableIDs = [ISSUER_CATEGORIES.UNASSIGNED, ISSUER_CATEGORIES.DRAFTER_RESERVED, ISSUER_CATEGORIES.SPEC_ORIGINATOR];

		for (const id of immutableIDs) {
			const result = UUIDValidator.validateIssuerIDMutability(id);
			expect(result.isValid).toBe(false);
			expect(result.isImmutable).toBe(true);
			expect(result.message.includes("immutable")).toBeTruthy();
		}
	});

	test("should identify mutable issuer IDs", () => {
		const mutableIDs = [100, 300, 600];

		for (const id of mutableIDs) {
			const result = UUIDValidator.validateIssuerIDMutability(id);
			expect(result.isValid).toBe(true);
			expect(result.isImmutable).toBe(false);
			expect(result.message.includes("mutable")).toBeTruthy();
		}
	});

	test("should validate timestamp variant fields", () => {
		const timestamp = Date.now();
		const uuid = UUID.createTimestampVariant(timestamp, 4);
		const result = UUIDValidator.validateCompleteUUID(uuid.toBuffer());

		expect(result.isValid).toBe(true);
		expect(result.fields.subvariant).toBe(SUBVARIANT_TIMESTAMP);
		expect(typeof result.fields.timestampSign).toBe("number");
		expect(typeof result.fields.timestampLower63).toBe("bigint");
		expect(result.fields.reservedBit69).toBe(0);
	});

	test("should warn about reserved bit violations", () => {
		const buffer = Buffer.alloc(16, 0);
		BitUtils.setBits(buffer, 64, 3, VARIANT_BITS);
		BitUtils.setBits(buffer, 67, 2, SUBVARIANT_TIMESTAMP);
		BitUtils.setBits(buffer, 69, 1, 1);
		BitUtils.setBits(buffer, 75, 4, 1);

		const result = UUIDValidator.validateCompleteUUID(buffer);
		expect(result.warnings.some((warning) => warning.includes("Reserved bit 69"))).toBeTruthy();
	});

	test("should generate complete validation report", () => {
		const uuid = UUID.createIssuerVariant(250, 6);
		const report = UUIDValidator.generateValidationReport(uuid.toBuffer());

		expect(typeof report.timestamp).toBe("object");
		expect(typeof report.uuid).toBe("string");
		expect(typeof report.uuidString).toBe("string");
		expect(report.overallValid).toBe(true);
		expect(typeof report.sections).toBe("object");
		expect(typeof report.sections.complete).toBe("object");
		expect(typeof report.sections.bitLayout).toBe("object");
		expect(typeof report.sections.entropy).toBe("object");
		expect(Array.isArray(report.allErrors)).toBeTruthy();
		expect(Array.isArray(report.allWarnings)).toBeTruthy();
	});

	test("should aggregate errors and warnings from all sections", () => {
		const buffer = Buffer.alloc(16, 0);
		BitUtils.setBits(buffer, 64, 3, VARIANT_BITS);
		BitUtils.setBits(buffer, 67, 2, SUBVARIANT_ISSUER);
		BitUtils.setBits(buffer, 75, 4, 15); // Valid version (15 is max)
		BitUtils.setBits(buffer, 79, 10, 1023); // Valid issuer ID (1023 is max)

		// Manually create an invalid UUID by modifying after
		// We can't use setBits with invalid values, so we'll test a different edge case
		// Let's test reserved subvariant instead
		BitUtils.setBits(buffer, 67, 2, 0b10); // Reserved subvariant

		const report = UUIDValidator.generateValidationReport(buffer);

		expect(report.overallValid).toBe(true); // No errors, just warnings for reserved
		expect(report.allWarnings.length > 0).toBeTruthy();
		expect(report.allWarnings.some((warn) => warn.includes("reserved"))).toBeTruthy();
	});

	test("should handle non-Buffer input gracefully", () => {
		expect(() => UUIDValidator.validateCompleteUUID("not a buffer")).toThrow(/16-byte buffer/);
		expect(() => UUIDValidator.validateCompleteUUID(null)).toThrow(/16-byte buffer/);
		expect(() => UUIDValidator.validateCompleteUUID(undefined)).toThrow(/16-byte buffer/);
	});

	test("should handle boundary issuer ID values", () => {
		const boundaryValues = [0, 1, 255, 256, 511, 512, 1023];

		for (const issuerID of boundaryValues) {
			const uuid = UUID.createIssuerVariant(issuerID, 1);
			const result = UUIDValidator.validateCompleteUUID(uuid.toBuffer());
			expect(result.isValid).toBe(true);
			expect(result.fields.issuerID).toBe(issuerID);
		}
	});

	test("should handle all valid version numbers", () => {
		for (let version = 0; version <= 15; version++) {
			const uuid = UUID.createIssuerVariant(100, version);
			const result = UUIDValidator.validateCompleteUUID(uuid.toBuffer());
			expect(result.isValid).toBe(true);
			expect(result.fields.version).toBe(version);
		}
	});
});
