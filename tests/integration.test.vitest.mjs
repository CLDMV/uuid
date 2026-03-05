/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /tests/integration.test.vitest.mjs
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
 * Vest Integration Test Suite for Custom UUID System
 *
 * End-to-end tests that validate the complete custom UUID system integration.
 */

import { describe, test, expect } from "vitest";
import { UUID, ISSUER_CATEGORIES } from "../src/uuid.mjs";
import { VARIANT_BITS, SUBVARIANT_ISSUER, SUBVARIANT_TIMESTAMP } from "../src/lib/constants.mjs";
import { IssuerRegistry } from "../src/lib/issuer-registry.mjs";
import { UUIDValidator } from "../src/lib/validators.mjs";
import { EntropySource } from "../src/lib/entropy-sources.mjs";
import { BitUtils } from "../src/lib/bit-utils.mjs";

describe("Integration Tests", () => {
	test("should create, validate, and parse UUID successfully", () => {
		const issuerID = 150;
		const version = 3;
		const uuid = UUID.createIssuerVariant(issuerID, version);

		const uuidString = uuid.toString();
		expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuidString)).toBeTruthy();

		const validation = UUIDValidator.validateCompleteUUID(uuid.toBuffer());
		expect(validation.isValid).toBe(true);
		expect(validation.isUUID).toBe(true);

		const parsed = new UUID(uuidString);
		expect(parsed.getIssuerID()).toBe(issuerID);
		expect(parsed.getVersion()).toBe(version);
		expect(parsed.isIssuerVariant()).toBeTruthy();

		expect(parsed.toString()).toBe(uuidString);
	});

	test("should maintain data integrity through multiple conversions", () => {
		const original = UUID.createTimestampVariant(Date.now(), 5);

		const stringCycle = new UUID(original.toString());
		expect(stringCycle.getIssuerID()).toBe(original.getIssuerID());
		expect(stringCycle.getVersion()).toBe(original.getVersion());
		expect(stringCycle.getSubvariant()).toBe(original.getSubvariant());

		const bufferCycle = new UUID(original.toBuffer());
		expect(bufferCycle.getIssuerID()).toBe(original.getIssuerID());
		expect(bufferCycle.getVersion()).toBe(original.getVersion());
		expect(bufferCycle.getSubvariant()).toBe(original.getSubvariant());
	});

	test("should register and validate issuers across categories", () => {
		const registry = new IssuerRegistry();

		const categoryAID = 100;
		registry.registerCategoryA(categoryAID, "TechCorp", "Major technology company");

		const categoryBID = 300;
		registry.registerCategoryB(categoryBID, "OpenProject", "Open source project");

		const uuidA = UUID.createIssuerVariant(categoryAID, 1);
		const uuidB = UUID.createIssuerVariant(categoryBID, 2);

		const validationA = UUIDValidator.validateCompleteUUID(uuidA.toBuffer());
		const validationB = UUIDValidator.validateCompleteUUID(uuidB.toBuffer());

		expect(validationA.isValid).toBe(true);
		expect(validationB.isValid).toBe(true);
		expect(validationA.fields.issuerCategory).toBe("Category A");
		expect(validationB.fields.issuerCategory).toBe("Category B");

		const issuerA = registry.getIssuer(categoryAID);
		const issuerB = registry.getIssuer(categoryBID);

		expect(issuerA.name).toBe("TechCorp");
		expect(issuerB.name).toBe("OpenProject");
	});

	test("should handle issuer registry export/import", () => {
		const registry1 = new IssuerRegistry();

		registry1.registerCategoryA(50, "Company1", "Description1");
		registry1.registerCategoryB(350, "Project1", "Description2");

		const exportData = registry1.export();
		const registry2 = new IssuerRegistry();
		registry2.import(exportData);

		const issuer1 = registry2.getIssuer(50);
		const issuer2 = registry2.getIssuer(350);

		expect(issuer1.name).toBe("Company1");
		expect(issuer2.name).toBe("Project1");
	});

	test("should generate UUIDs with good entropy distribution", () => {
		const uuids = [];
		const sampleSize = 100;

		for (let i = 0; i < sampleSize; i++) {
			const uuid = UUID.createIssuerVariant(100 + (i % 100), 1);
			uuids.push(uuid);
		}

		const uniqueUUIDs = new Set(uuids.map((u) => u.toString()));
		expect(uniqueUUIDs.size).toBe(sampleSize);

		const entropyResults = uuids.slice(0, 10).map((uuid) => UUIDValidator.validateEntropy(uuid.toBuffer()));

		for (const result of entropyResults) {
			expect(result.entropyBits > 50).toBeTruthy();
		}
	});

	test("should validate entropy source quality", () => {
		const entropy = EntropySource.generateValidatedEntropy(16);
		expect(entropy.length).toBe(16);

		const validation = EntropySource.validateEntropyQuality(entropy);
		expect(validation.passed).toBe(true);
		expect(validation.tests.allZeros.passed).toBeTruthy();
		expect(validation.tests.allOnes.passed).toBeTruthy();
		expect(validation.tests.bitBalance.passed).toBeTruthy();
	});

	test("should enforce immutable field constraints", () => {
		const immutableIDs = [ISSUER_CATEGORIES.UNASSIGNED, ISSUER_CATEGORIES.DRAFTER_RESERVED, ISSUER_CATEGORIES.SPEC_ORIGINATOR];

		for (const id of immutableIDs) {
			const uuid = UUID.createIssuerVariant(id, 1);
			const validation = UUIDValidator.validateCompleteUUID(uuid.toBuffer());

			expect(validation.isValid).toBe(true);
			expect(validation.fields.issuerID).toBe(id);

			const mutabilityCheck = UUIDValidator.validateIssuerIDMutability(id);
			expect(mutabilityCheck.isImmutable).toBe(true);
		}
	});

	test("should maintain consistent bit layout across variants", () => {
		const issuerUUID = UUID.createIssuerVariant(200, 3);
		const timestampUUID = UUID.createTimestampVariant(Date.now(), 3);

		// Both variants share these immutable fields
		expect(issuerUUID.getVariant()).toBe(timestampUUID.getVariant());
		expect(issuerUUID.getVersion()).toBe(timestampUUID.getVersion());

		// But have different subvariants
		expect(issuerUUID.getSubvariant()).not.toBe(timestampUUID.getSubvariant());

		// Only issuer variant has issuerID field
		expect(issuerUUID.getIssuerID()).toBe(200);
	});

	test("should validate bit position compliance", () => {
		const uuid = UUID.createIssuerVariant(123, 7);
		const buffer = uuid.toBuffer();

		const variant = BitUtils.getBitsAsNumber(buffer, 64, 3);
		const subvariant = BitUtils.getBitsAsNumber(buffer, 67, 2);
		const version = BitUtils.getBitsAsNumber(buffer, 75, 4);
		const issuerID = BitUtils.getBitsAsNumber(buffer, 79, 10);

		expect(variant).toBe(VARIANT_BITS);
		expect(subvariant).toBe(SUBVARIANT_ISSUER);
		expect(version).toBe(7);
		expect(issuerID).toBe(123);
	});

	test("should handle large-scale UUID generation efficiently", () => {
		const startTime = Date.now();
		const uuids = [];
		const count = 1000;

		for (let i = 0; i < count; i++) {
			const uuid = UUID.createIssuerVariant(100 + (i % 900), 1 + (i % 15));
			uuids.push(uuid.toString());
		}

		const endTime = Date.now();
		const duration = endTime - startTime;

		expect(duration < 5000).toBeTruthy();

		const uniqueUUIDs = new Set(uuids);
		expect(uniqueUUIDs.size).toBe(count);
	});

	test("should handle validation at scale", () => {
		const uuids = [];
		for (let i = 0; i < 100; i++) {
			uuids.push(UUID.createIssuerVariant(100 + i, 1 + (i % 15)));
		}

		const startTime = Date.now();

		for (const uuid of uuids) {
			const validation = UUIDValidator.validateCompleteUUID(uuid.toBuffer());
			expect(validation.isValid).toBe(true);
		}

		const endTime = Date.now();
		const duration = endTime - startTime;

		expect(duration < 2000).toBeTruthy();
	});

	test("should handle malformed UUID data gracefully", () => {
		const testCases = [
			"invalid-uuid-string",
			"123e4567-e89b-12d3-a456",
			"123e4567-e89b-12d3-a456-426614174000-extra",
			Buffer.alloc(15),
			Buffer.alloc(17)
		];

		for (const testCase of testCases) {
			expect(() => new UUID(testCase)).toThrow();
		}

		// null and undefined should create empty UUIDs, not throw
		expect(() => new UUID(null)).not.toThrow();
		expect(() => new UUID(undefined)).not.toThrow();
	});

	test("should detect and report specification violations", () => {
		const buffer = Buffer.alloc(16, 0);
		BitUtils.setBits(buffer, 64, 3, VARIANT_BITS);
		BitUtils.setBits(buffer, 67, 2, SUBVARIANT_ISSUER);
		BitUtils.setBits(buffer, 75, 4, 15);
		BitUtils.setBits(buffer, 79, 10, 1023);

		const report = UUIDValidator.generateValidationReport(buffer);

		expect(report.overallValid).toBe(true);
		expect(report.allErrors.length).toBe(0);
	});

	test("should coexist with standard UUID libraries", () => {
		const customUuid = UUID.createIssuerVariant(100, 1);
		const customString = customUuid.toString();

		expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(customString)).toBeTruthy();

		const hexString = customString.replace(/-/g, "");
		const parsedBuffer = Buffer.from(hexString, "hex");
		expect(parsedBuffer.length).toBe(16);
	});

	test("should maintain forward compatibility with specification evolution", () => {
		const buffer = Buffer.alloc(16, 0);
		BitUtils.setBits(buffer, 64, 3, VARIANT_BITS);
		BitUtils.setBits(buffer, 67, 2, 0b10);
		BitUtils.setBits(buffer, 75, 4, 1);
		BitUtils.setBits(buffer, 78, 10, 100);

		const validation = UUIDValidator.validateCompleteUUID(buffer);
		expect(validation.warnings.some((warning) => warning.includes("reserved"))).toBeTruthy();
	});
});
