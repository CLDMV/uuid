/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /tests/ultra-short-variants.test.vitest.mjs
 *	@Date: 2025-12-19T20:14:21-08:00 (1766204061)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-03-04 21:04:03 -08:00 (1772687043)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Vitest Test Suite for Ultra-Short UUID Variant Methods
 *
 * Comprehensive test that creates each ultra-short custom UUID variant (TA, TB, IA)
 * and verifies all extracted data matches expected values.
 */

import { describe, test, expect } from "vitest";
import { UUID, ISSUER_CATEGORIES } from "../src/uuid.mjs";
import { VARIANT_BITS, SUBVARIANT_ISSUER, SUBVARIANT_TIMESTAMP } from "../src/lib/constants.mjs";
import { UUIDValidator } from "../src/lib/validators.mjs";
import { BitUtils } from "../src/lib/bit-utils.mjs";

describe("Ultra-Short UUID Variant Methods (TA, TB, IA)", () => {
	test("should create TA (Timestamp Variant v1 - seconds) and verify all data", () => {
		const timestamp = Date.now();
		const uuid = UUID.TA(timestamp);

		// Verify basic structure
		expect(uuid instanceof UUID).toBe(true);
		expect(uuid.toBuffer().length).toBe(16);

		// Verify string format
		const uuidString = uuid.toString();
		expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuidString)).toBe(true);

		// Verify variant and subvariant
		expect(uuid.getVariant()).toBe(VARIANT_BITS);
		expect(uuid.getSubvariant()).toBe(SUBVARIANT_TIMESTAMP);
		expect(uuid.isUUID()).toBe(true);
		expect(uuid.isTimestampVariant()).toBe(true);
		expect(uuid.isIssuerVariant()).toBe(false);

		// Verify version
		expect(uuid.getVersion()).toBe(1);

		// Verify timestamp variant does NOT have issuer ID
		expect(uuid.getIssuerID()).toBe(null);

		// Verify bit positions using BitUtils
		const buffer = uuid.toBuffer();
		expect(BitUtils.getBitsAsNumber(buffer, 64, 3)).toBe(VARIANT_BITS);
		expect(BitUtils.getBitsAsNumber(buffer, 67, 2)).toBe(SUBVARIANT_TIMESTAMP);
		expect(BitUtils.getBitsAsNumber(buffer, 75, 4)).toBe(1);

		// Verify validator sees it correctly
		const validation = UUIDValidator.validateCompleteUUID(buffer);
		expect(validation.isValid).toBe(true);
		expect(validation.isUUID).toBe(true);
		expect(validation.fields.variant).toBe(VARIANT_BITS);
		expect(validation.fields.subvariant).toBe(SUBVARIANT_TIMESTAMP);
		expect(validation.fields.version).toBe(1);

		// Verify getInfo() returns complete data
		const info = uuid.getInfo();
		expect(info.uuid).toBe(uuidString);
		expect(info.isUUID).toBe(true);
		expect(info.variant).toBe(VARIANT_BITS);
		expect(info.subvariant).toBe(SUBVARIANT_TIMESTAMP);
		expect(info.version).toBe(1);
		expect(info.isTimestampVariant).toBe(true);
		expect(info.isIssuerVariant).toBe(false);
		expect(info.issuerID).toBe(null);
	});

	test("should create TB (Timestamp Variant v2 - milliseconds) and verify all data", () => {
		const timestamp = Date.now();
		const uuid = UUID.TB(timestamp);

		// Verify basic structure
		expect(uuid instanceof UUID).toBe(true);
		expect(uuid.toBuffer().length).toBe(16);

		// Verify string format
		const uuidString = uuid.toString();
		expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuidString)).toBe(true);

		// Verify variant and subvariant
		expect(uuid.getVariant()).toBe(VARIANT_BITS);
		expect(uuid.getSubvariant()).toBe(SUBVARIANT_TIMESTAMP);
		expect(uuid.isUUID()).toBe(true);
		expect(uuid.isTimestampVariant()).toBe(true);
		expect(uuid.isIssuerVariant()).toBe(false);

		// Verify version
		expect(uuid.getVersion()).toBe(2);

		// Verify timestamp variant does NOT have issuer ID
		expect(uuid.getIssuerID()).toBe(null);

		// Verify bit positions using BitUtils
		const buffer = uuid.toBuffer();
		expect(BitUtils.getBitsAsNumber(buffer, 64, 3)).toBe(VARIANT_BITS);
		expect(BitUtils.getBitsAsNumber(buffer, 67, 2)).toBe(SUBVARIANT_TIMESTAMP);
		expect(BitUtils.getBitsAsNumber(buffer, 75, 4)).toBe(2);

		// Verify validator sees it correctly
		const validation = UUIDValidator.validateCompleteUUID(buffer);
		expect(validation.isValid).toBe(true);
		expect(validation.isUUID).toBe(true);
		expect(validation.fields.variant).toBe(VARIANT_BITS);
		expect(validation.fields.subvariant).toBe(SUBVARIANT_TIMESTAMP);
		expect(validation.fields.version).toBe(2);

		// Verify getInfo() returns complete data
		const info = uuid.getInfo();
		expect(info.uuid).toBe(uuidString);
		expect(info.isUUID).toBe(true);
		expect(info.variant).toBe(VARIANT_BITS);
		expect(info.subvariant).toBe(SUBVARIANT_TIMESTAMP);
		expect(info.version).toBe(2);
		expect(info.isTimestampVariant).toBe(true);
		expect(info.isIssuerVariant).toBe(false);
		expect(info.issuerID).toBe(null);
	});

	test("should create IA (Issuer Variant v1) and verify all data", () => {
		const issuerID = 404;
		const uuid = UUID.IA(issuerID);

		// Verify basic structure
		expect(uuid instanceof UUID).toBe(true);
		expect(uuid.toBuffer().length).toBe(16);

		// Verify string format
		const uuidString = uuid.toString();
		expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuidString)).toBe(true);

		// Verify variant and subvariant
		expect(uuid.getVariant()).toBe(VARIANT_BITS);
		expect(uuid.getSubvariant()).toBe(SUBVARIANT_ISSUER);
		expect(uuid.isUUID()).toBe(true);
		expect(uuid.isTimestampVariant()).toBe(false);
		expect(uuid.isIssuerVariant()).toBe(true);

		// Verify version
		expect(uuid.getVersion()).toBe(1);

		// Verify issuer ID
		expect(uuid.getIssuerID()).toBe(issuerID);
		expect(uuid.getIssuerCategory()).toBe("Spec Originator");

		// Verify bit positions using BitUtils
		const buffer = uuid.toBuffer();
		expect(BitUtils.getBitsAsNumber(buffer, 64, 3)).toBe(VARIANT_BITS);
		expect(BitUtils.getBitsAsNumber(buffer, 67, 2)).toBe(SUBVARIANT_ISSUER);
		expect(BitUtils.getBitsAsNumber(buffer, 75, 4)).toBe(1);
		expect(BitUtils.getBitsAsNumber(buffer, 79, 10)).toBe(issuerID);

		// Verify validator sees it correctly
		const validation = UUIDValidator.validateCompleteUUID(buffer);
		expect(validation.isValid).toBe(true);
		expect(validation.isUUID).toBe(true);
		expect(validation.fields.variant).toBe(VARIANT_BITS);
		expect(validation.fields.subvariant).toBe(SUBVARIANT_ISSUER);
		expect(validation.fields.version).toBe(1);
		expect(validation.fields.issuerID).toBe(issuerID);

		// Verify getInfo() returns complete data
		const info = uuid.getInfo();
		expect(info.uuid).toBe(uuidString);
		expect(info.isUUID).toBe(true);
		expect(info.variant).toBe(VARIANT_BITS);
		expect(info.subvariant).toBe(SUBVARIANT_ISSUER);
		expect(info.version).toBe(1);
		expect(info.isTimestampVariant).toBe(false);
		expect(info.isIssuerVariant).toBe(true);
		expect(info.issuerID).toBe(issuerID);
		expect(info.issuerCategory).toBe("Spec Originator");
	});

	test("should verify TA and TB share subvariant 00 but have different versions", () => {
		const timestamp = Date.now();
		const uuidTA = UUID.TA(timestamp);
		const uuidTB = UUID.TB(timestamp);

		// Both should be Timestamp Variant (subvariant 00)
		expect(uuidTA.getSubvariant()).toBe(SUBVARIANT_TIMESTAMP);
		expect(uuidTB.getSubvariant()).toBe(SUBVARIANT_TIMESTAMP);
		expect(uuidTA.getSubvariant()).toBe(uuidTB.getSubvariant());

		// Both should be timestamp variants
		expect(uuidTA.isTimestampVariant()).toBe(true);
		expect(uuidTB.isTimestampVariant()).toBe(true);

		// But have different versions
		expect(uuidTA.getVersion()).toBe(1);
		expect(uuidTB.getVersion()).toBe(2);
		expect(uuidTA.getVersion()).not.toBe(uuidTB.getVersion());
	});

	test("should verify IA uses different subvariant than TA/TB", () => {
		const timestamp = Date.now();
		const issuerID = 100;

		const uuidTA = UUID.TA(timestamp);
		const uuidTB = UUID.TB(timestamp);
		const uuidIA = UUID.IA(issuerID);

		// TA and TB should have subvariant 00 (Timestamp)
		expect(uuidTA.getSubvariant()).toBe(SUBVARIANT_TIMESTAMP);
		expect(uuidTB.getSubvariant()).toBe(SUBVARIANT_TIMESTAMP);

		// IA should have subvariant 01 (Issuer)
		expect(uuidIA.getSubvariant()).toBe(SUBVARIANT_ISSUER);

		// They should be different
		expect(uuidIA.getSubvariant()).not.toBe(uuidTA.getSubvariant());
		expect(uuidIA.getSubvariant()).not.toBe(uuidTB.getSubvariant());
	});

	test("should create TA with default timestamp (Date.now())", () => {
		const beforeTime = Date.now();
		const uuid = UUID.TA();
		const afterTime = Date.now();

		// Should create successfully without explicit timestamp
		expect(uuid instanceof UUID).toBe(true);
		expect(uuid.getVersion()).toBe(1);
		expect(uuid.isTimestampVariant()).toBe(true);

		// The timestamp should be within a reasonable range
		// (We can't verify the exact value, but we can verify it was created)
		expect(uuid.toBuffer().length).toBe(16);
	});

	test("should create TB with default timestamp (Date.now())", () => {
		const beforeTime = Date.now();
		const uuid = UUID.TB();
		const afterTime = Date.now();

		// Should create successfully without explicit timestamp
		expect(uuid instanceof UUID).toBe(true);
		expect(uuid.getVersion()).toBe(2);
		expect(uuid.isTimestampVariant()).toBe(true);

		// The timestamp should be within a reasonable range
		expect(uuid.toBuffer().length).toBe(16);
	});

	test("should roundtrip all ultra-short variants through string conversion", () => {
		const timestamp = Date.now();
		const issuerID = 250;

		const uuidTA = UUID.TA(timestamp);
		const uuidTB = UUID.TB(timestamp);
		const uuidIA = UUID.IA(issuerID);

		// Convert to string and back
		const reconstructedTA = new UUID(uuidTA.toString());
		const reconstructedTB = new UUID(uuidTB.toString());
		const reconstructedIA = new UUID(uuidIA.toString());

		// Verify TA data persisted
		expect(reconstructedTA.getVariant()).toBe(VARIANT_BITS);
		expect(reconstructedTA.getSubvariant()).toBe(SUBVARIANT_TIMESTAMP);
		expect(reconstructedTA.getVersion()).toBe(1);
		expect(reconstructedTA.isTimestampVariant()).toBe(true);

		// Verify TB data persisted
		expect(reconstructedTB.getVariant()).toBe(VARIANT_BITS);
		expect(reconstructedTB.getSubvariant()).toBe(SUBVARIANT_TIMESTAMP);
		expect(reconstructedTB.getVersion()).toBe(2);
		expect(reconstructedTB.isTimestampVariant()).toBe(true);

		// Verify IA data persisted
		expect(reconstructedIA.getVariant()).toBe(VARIANT_BITS);
		expect(reconstructedIA.getSubvariant()).toBe(SUBVARIANT_ISSUER);
		expect(reconstructedIA.getVersion()).toBe(1);
		expect(reconstructedIA.getIssuerID()).toBe(issuerID);
		expect(reconstructedIA.isIssuerVariant()).toBe(true);
	});

	test("should roundtrip all ultra-short variants through buffer conversion", () => {
		const timestamp = Date.now();
		const issuerID = 350;

		const uuidTA = UUID.TA(timestamp);
		const uuidTB = UUID.TB(timestamp);
		const uuidIA = UUID.IA(issuerID);

		// Convert to buffer and back
		const reconstructedTA = new UUID(uuidTA.toBuffer());
		const reconstructedTB = new UUID(uuidTB.toBuffer());
		const reconstructedIA = new UUID(uuidIA.toBuffer());

		// Verify TA data persisted
		expect(reconstructedTA.getVariant()).toBe(VARIANT_BITS);
		expect(reconstructedTA.getSubvariant()).toBe(SUBVARIANT_TIMESTAMP);
		expect(reconstructedTA.getVersion()).toBe(1);

		// Verify TB data persisted
		expect(reconstructedTB.getVariant()).toBe(VARIANT_BITS);
		expect(reconstructedTB.getSubvariant()).toBe(SUBVARIANT_TIMESTAMP);
		expect(reconstructedTB.getVersion()).toBe(2);

		// Verify IA data persisted
		expect(reconstructedIA.getVariant()).toBe(VARIANT_BITS);
		expect(reconstructedIA.getSubvariant()).toBe(SUBVARIANT_ISSUER);
		expect(reconstructedIA.getVersion()).toBe(1);
		expect(reconstructedIA.getIssuerID()).toBe(issuerID);
	});

	test("should verify all ultra-short variants pass complete validation", () => {
		const timestamp = Date.now();
		const issuerID = 404;

		const uuidTA = UUID.TA(timestamp);
		const uuidTB = UUID.TB(timestamp);
		const uuidIA = UUID.IA(issuerID);

		// Run complete validation on each
		const validationTA = UUIDValidator.validateCompleteUUID(uuidTA.toBuffer());
		const validationTB = UUIDValidator.validateCompleteUUID(uuidTB.toBuffer());
		const validationIA = UUIDValidator.validateCompleteUUID(uuidIA.toBuffer());

		// All should pass
		expect(validationTA.isValid).toBe(true);
		expect(validationTA.errors.length).toBe(0);
		expect(validationTB.isValid).toBe(true);
		expect(validationTB.errors.length).toBe(0);
		expect(validationIA.isValid).toBe(true);
		expect(validationIA.errors.length).toBe(0);

		// Generate full validation reports
		const reportTA = UUIDValidator.generateValidationReport(uuidTA.toBuffer());
		const reportTB = UUIDValidator.generateValidationReport(uuidTB.toBuffer());
		const reportIA = UUIDValidator.generateValidationReport(uuidIA.toBuffer());

		expect(reportTA.overallValid).toBe(true);
		expect(reportTB.overallValid).toBe(true);
		expect(reportIA.overallValid).toBe(true);
	});

	test("should verify each ultra-short variant produces unique UUIDs", () => {
		const timestamp = Date.now();
		const issuerID = 100;

		// Generate multiple of each type
		const tauuids = new Set();
		const tbuuids = new Set();
		const iauuids = new Set();

		for (let i = 0; i < 100; i++) {
			tauuids.add(UUID.TA(timestamp + i).toString());
			tbuuids.add(UUID.TB(timestamp + i).toString());
			iauuids.add(UUID.IA(issuerID).toString());
		}

		// Each should have 100 unique values
		expect(tauuids.size).toBe(100);
		expect(tbuuids.size).toBe(100);
		expect(iauuids.size).toBe(100);

		// No overlap between variant types
		const allUUIDs = new Set([...tauuids, ...tbuuids, ...iauuids]);
		expect(allUUIDs.size).toBe(300);
	});

	test("should handle negative timestamps for TA (before Unix epoch)", () => {
		// Test various negative timestamps (before January 1, 1970)
		const testCases = [
			{ timestamp: -1000, desc: "1 second before epoch" },
			{ timestamp: -60000, desc: "1 minute before epoch" },
			{ timestamp: -3600000, desc: "1 hour before epoch" },
			{ timestamp: -86400000, desc: "1 day before epoch" },
			{ timestamp: -31536000000, desc: "1 year before epoch" },
			{ timestamp: -315619200000, desc: "~10 years before epoch" }
		];

		for (const testCase of testCases) {
			const uuid = UUID.TA(testCase.timestamp);

			// Verify it's a valid timestamp variant
			expect(uuid.isTimestampVariant()).toBe(true);
			expect(uuid.getVariant()).toBe(VARIANT_BITS);
			expect(uuid.getSubvariant()).toBe(SUBVARIANT_TIMESTAMP);
			expect(uuid.getVersion()).toBe(1);

			// Verify timestamp extraction
			const extracted = uuid.getTimestamp();
			expect(extracted).toBe(testCase.timestamp);

			// Verify it's actually negative
			expect(extracted).toBeLessThan(0);

			// Verify date can be created
			const date = new Date(extracted);
			expect(date.getTime()).toBe(testCase.timestamp);
			expect(date.getFullYear()).toBeLessThan(1970);
		}
	});

	test("should handle negative timestamps for TB (before Unix epoch)", () => {
		// Test various negative timestamps (before January 1, 1970)
		const testCases = [
			{ timestamp: -1000, desc: "1 second before epoch" },
			{ timestamp: -60000, desc: "1 minute before epoch" },
			{ timestamp: -3600000, desc: "1 hour before epoch" },
			{ timestamp: -86400000, desc: "1 day before epoch" },
			{ timestamp: -31536000000, desc: "1 year before epoch" },
			{ timestamp: -315619200000, desc: "~10 years before epoch" }
		];

		for (const testCase of testCases) {
			const uuid = UUID.TB(testCase.timestamp);

			// Verify it's a valid timestamp variant
			expect(uuid.isTimestampVariant()).toBe(true);
			expect(uuid.getVariant()).toBe(VARIANT_BITS);
			expect(uuid.getSubvariant()).toBe(SUBVARIANT_TIMESTAMP);
			expect(uuid.getVersion()).toBe(2);

			// Verify timestamp extraction
			const extracted = uuid.getTimestamp();
			expect(extracted).toBe(testCase.timestamp);

			// Verify it's actually negative
			expect(extracted).toBeLessThan(0);

			// Verify date can be created
			const date = new Date(extracted);
			expect(date.getTime()).toBe(testCase.timestamp);
			expect(date.getFullYear()).toBeLessThan(1970);
		}
	});

	test("should correctly order negative and positive timestamps", () => {
		const timestamps = [
			-315619200000, // ~10 years before epoch
			-86400000, // 1 day before epoch
			-1000, // 1 second before epoch
			0, // Unix epoch
			1000, // 1 second after epoch
			86400000, // 1 day after epoch
			Date.now() // Current time
		];

		// Create UUIDs with these timestamps
		const uuidsTA = timestamps.map((ts) => ({ uuid: UUID.TA(ts), timestamp: ts }));
		const uuidsTB = timestamps.map((ts) => ({ uuid: UUID.TB(ts), timestamp: ts }));

		// Verify each extracted timestamp matches original
		for (const item of uuidsTA) {
			expect(item.uuid.getTimestamp()).toBe(item.timestamp);
		}

		for (const item of uuidsTB) {
			expect(item.uuid.getTimestamp()).toBe(item.timestamp);
		}
	});

	test("should handle very large negative timestamps", () => {
		// Test timestamps far in the past
		const veryOldTimestamp = -2208988800000; // January 1, 1900

		const uuidTA = UUID.TA(veryOldTimestamp);
		const uuidTB = UUID.TB(veryOldTimestamp);

		expect(uuidTA.getTimestamp()).toBe(veryOldTimestamp);
		expect(uuidTB.getTimestamp()).toBe(veryOldTimestamp);

		const dateTA = new Date(uuidTA.getTimestamp());
		const dateTB = new Date(uuidTB.getTimestamp());

		// Check year is around 1900 (allowing for timezone offsets)
		expect(dateTA.getFullYear()).toBeGreaterThanOrEqual(1899);
		expect(dateTA.getFullYear()).toBeLessThanOrEqual(1900);
		expect(dateTB.getFullYear()).toBeGreaterThanOrEqual(1899);
		expect(dateTB.getFullYear()).toBeLessThanOrEqual(1900);

		// String roundtrip
		const fromStringTA = new UUID(uuidTA.toString());
		const fromStringTB = new UUID(uuidTB.toString());

		expect(fromStringTA.getTimestamp()).toBe(veryOldTimestamp);
		expect(fromStringTB.getTimestamp()).toBe(veryOldTimestamp);

		// Buffer roundtrip
		const fromBufferTA = new UUID(uuidTA.toBuffer());
		const fromBufferTB = new UUID(uuidTB.toBuffer());

		expect(fromBufferTA.getTimestamp()).toBe(veryOldTimestamp);
		expect(fromBufferTB.getTimestamp()).toBe(veryOldTimestamp);
	});
});
