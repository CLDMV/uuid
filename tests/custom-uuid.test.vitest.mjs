/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /tests/custom-uuid.test.vitest.mjs
 *	@Date: 2025-12-15T20:33:49-08:00 (1765859629)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-03-04 21:04:03 -08:00 (1772687043)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Vitest Test Suite for Custom UUID Implementation
 *
 * Comprehensive tests for the custom UUID specification implementation.
 * Tests cover bit-level operations, specification compliance, and edge cases.
 */

import { describe, test, expect } from "vitest";
import { UUID, ISSUER_CATEGORIES } from "../src/uuid.mjs";
import { VARIANT_BITS, SUBVARIANT_ISSUER, SUBVARIANT_TIMESTAMP } from "../src/lib/constants.mjs";
import { UUIDValidator } from "../src/lib/validators.mjs";
import { BitUtils } from "../src/lib/bit-utils.mjs";

describe("Custom UUID Implementation", () => {
	test("should create a new empty UUID instance", () => {
		const uuid = new UUID();
		expect(uuid instanceof UUID).toBeTruthy();
		expect(uuid.toBuffer().length).toBe(16);
	});

	test("should parse UUID from hex string", () => {
		const hexString = "123e4567-e89b-12d3-a456-426614174000";
		const uuid = new UUID(hexString);
		expect(uuid.toString()).toBe(hexString);
	});

	test("should parse UUID from buffer", () => {
		const buffer = Buffer.from("123e4567e89b12d3a456426614174000", "hex");
		const uuid = new UUID(buffer);
		expect(uuid.toBuffer().toString("hex")).toBe(buffer.toString("hex"));
	});

	test("should throw error for invalid string length", () => {
		expect(() => new UUID("invalid")).toThrow(/Invalid UUID string length/);
	});

	test("should throw error for invalid buffer length", () => {
		expect(() => new UUID(Buffer.alloc(15))).toThrow(/Invalid UUID buffer length/);
	});

	test("should create valid issuer variant UUID", () => {
		const issuerID = 100;
		const version = 1;
		const uuid = UUID.createIssuerVariant(issuerID, version);

		expect(uuid.getVariant()).toBe(VARIANT_BITS);
		expect(uuid.getSubvariant()).toBe(SUBVARIANT_ISSUER);
		expect(uuid.getVersion()).toBe(version);
		expect(uuid.getIssuerID()).toBe(issuerID);
		expect(uuid.isUUID()).toBeTruthy();
		expect(uuid.isIssuerVariant()).toBeTruthy();
		expect(uuid.isTimestampVariant()).toBeFalsy();
	});

	test("should validate issuer ID ranges", () => {
		// Valid issuer IDs
		expect(() => UUID.createIssuerVariant(0, 1)).not.toThrow();
		expect(() => UUID.createIssuerVariant(1023, 1)).not.toThrow();

		// Invalid issuer IDs
		expect(() => UUID.createIssuerVariant(-1, 1)).toThrow(/Invalid issuer ID/);
		expect(() => UUID.createIssuerVariant(1024, 1)).toThrow(/Invalid issuer ID/);
		expect(() => UUID.createIssuerVariant("invalid", 1)).toThrow(/Invalid issuer ID/);
	});

	test("should handle all issuer ID categories", () => {
		const testCases = [
			{ id: ISSUER_CATEGORIES.UNASSIGNED, category: "Unassigned" },
			{ id: ISSUER_CATEGORIES.DRAFTER_RESERVED, category: "Drafter Reserved" },
			{ id: 100, category: "Category A (Well-Recognized Tech Entities)" },
			{ id: 300, category: "Category B (Open Source Contributors)" },
			{ id: ISSUER_CATEGORIES.SPEC_ORIGINATOR, category: "Spec Originator" },
			{ id: 600, category: "Future RFC Expansion" }
		];

		for (const testCase of testCases) {
			const uuid = UUID.createIssuerVariant(testCase.id, 1);
			expect(uuid.getIssuerID()).toBe(testCase.id);
			expect(uuid.getIssuerCategory()).toBe(testCase.category);
		}
	});

	test("should create valid timestamp variant UUID", () => {
		const timestamp = Date.now();
		const version = 2;
		const uuid = UUID.createTimestampVariant(timestamp, version);

		expect(uuid.getVariant()).toBe(VARIANT_BITS);
		expect(uuid.getSubvariant()).toBe(SUBVARIANT_TIMESTAMP);
		expect(uuid.getVersion()).toBe(version);
		// Timestamp variant does not have issuerID field
		expect(uuid.isUUID()).toBeTruthy();
		expect(uuid.isIssuerVariant()).toBeFalsy();
		expect(uuid.isTimestampVariant()).toBeTruthy();
	});

	test("should handle Date objects for timestamp", () => {
		const date = new Date();
		const uuid = UUID.createTimestampVariant(date, 1);
		expect(uuid.isTimestampVariant()).toBeTruthy();
	});

	// Removed test for issuer ID validation in timestamp variant - timestamp variant doesn't have issuer ID

	test("should correctly set and get bits through public API", () => {
		const issuerUuid = UUID.createIssuerVariant(512, 5);

		expect(issuerUuid.getVariant()).toBe(VARIANT_BITS);
		expect(issuerUuid.getSubvariant()).toBe(SUBVARIANT_ISSUER);
		expect(issuerUuid.getVersion()).toBe(5);
		expect(issuerUuid.getIssuerID()).toBe(512);

		const timestampUuid = UUID.createTimestampVariant(Date.now(), 3);
		expect(timestampUuid.getVariant()).toBe(VARIANT_BITS);
		expect(timestampUuid.getSubvariant()).toBe(SUBVARIANT_TIMESTAMP);
		expect(timestampUuid.getVersion()).toBe(3);
		// Timestamp variant does not have issuerID field
	});

	test("should validate issuer ID range boundaries", () => {
		// Valid ranges
		expect(() => UUID.createIssuerVariant(0, 1)).not.toThrow();
		expect(() => UUID.createIssuerVariant(1023, 1)).not.toThrow();

		// Invalid ranges
		expect(() => UUID.createIssuerVariant(-1, 1)).toThrow(/Invalid issuer ID/);
		expect(() => UUID.createIssuerVariant(1024, 1)).toThrow(/Invalid issuer ID/);
	});

	test("should validate value ranges for bit fields", () => {
		// Valid values
		expect(() => UUID.createIssuerVariant(1023, 15)).not.toThrow();

		const buffer = Buffer.alloc(16);

		// Valid values
		expect(() => BitUtils.setBits(buffer, 0, 3, 7)).not.toThrow();
		expect(() => BitUtils.setBits(buffer, 0, 10, 1023)).not.toThrow();

		// Invalid values
		expect(() => BitUtils.setBits(buffer, 0, 3, 8)).toThrow(/Value .+ too large/);
		expect(() => BitUtils.setBits(buffer, 0, 10, 1024)).toThrow(/Value .+ too large/);
	});

	test("should provide complete UUID information", () => {
		const issuerID = 200;
		const version = 3;
		const uuid = UUID.createIssuerVariant(issuerID, version);
		const info = uuid.getInfo();

		expect(typeof info.uuid).toBe("string");
		expect(info.isUUID).toBe(true);
		expect(info.variant).toBe(VARIANT_BITS);
		expect(info.subvariant).toBe(SUBVARIANT_ISSUER);
		expect(info.version).toBe(version);
		expect(info.issuerID).toBe(issuerID);
		expect(info.isIssuerVariant).toBe(true);
		expect(info.isTimestampVariant).toBe(false);
		expect(typeof info.issuerCategory).toBe("string");
	});

	test("should convert to standard UUID string format", () => {
		const uuid = UUID.createIssuerVariant(100, 1);
		const uuidString = uuid.toString();

		expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuidString)).toBeTruthy();
	});

	test("should maintain data integrity through conversions", () => {
		const originalUUID = UUID.createIssuerVariant(150, 2);
		const uuidString = originalUUID.toString();
		const buffer = originalUUID.toBuffer();

		// Create new UUID from string
		const fromString = new UUID(uuidString);
		expect(fromString.getIssuerID()).toBe(150);
		expect(fromString.getVersion()).toBe(2);

		// Create new UUID from buffer
		const fromBuffer = new UUID(buffer);
		expect(fromBuffer.getIssuerID()).toBe(150);
		expect(fromBuffer.getVersion()).toBe(2);
	});

	test("should handle boundary issuer IDs", () => {
		const boundaryTests = [0, 1, 255, 256, 511, 512, 1023];

		for (const issuerID of boundaryTests) {
			const uuid = UUID.createIssuerVariant(issuerID, 1);
			expect(uuid.getIssuerID()).toBe(issuerID);
		}
	});

	test("should handle all version numbers", () => {
		for (let version = 0; version <= 15; version++) {
			const uuid = UUID.createIssuerVariant(100, version);
			expect(uuid.getVersion()).toBe(version);
		}
	});

	test("should detect non-spec compliant UUIDs", () => {
		const buffer = Buffer.from("123e4567e89b12d3a456426614174000", "hex");
		const uuid = new UUID(buffer);

		expect(uuid.isUUID()).toBeFalsy();
		expect(uuid.isIssuerVariant()).toBeFalsy();
		expect(uuid.isTimestampVariant()).toBeFalsy();
	});

	test("should maintain immutable fields during entropy filling", () => {
		const issuerID = 300;
		const version = 4;
		const uuid = UUID.createIssuerVariant(issuerID, version);

		expect(uuid.getVariant()).toBe(VARIANT_BITS);
		expect(uuid.getSubvariant()).toBe(SUBVARIANT_ISSUER);
		expect(uuid.getVersion()).toBe(version);
		expect(uuid.getIssuerID()).toBe(issuerID);
	});

	test("should preserve immutable fields across multiple operations", () => {
		const uuid = UUID.createIssuerVariant(404, 7);
		const originalVariant = uuid.getVariant();
		const originalSubvariant = uuid.getSubvariant();
		const originalVersion = uuid.getVersion();
		const originalIssuerID = uuid.getIssuerID();

		// Convert to string and back
		const reconstructed = new UUID(uuid.toString());

		expect(reconstructed.getVariant()).toBe(originalVariant);
		expect(reconstructed.getSubvariant()).toBe(originalSubvariant);
		expect(reconstructed.getVersion()).toBe(originalVersion);
		expect(reconstructed.getIssuerID()).toBe(originalIssuerID);
	});
});
