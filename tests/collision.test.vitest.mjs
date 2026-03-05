/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /tests/collision.test.vitest.mjs
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
 * Collision Test Suite for Custom UUID Implementation
 *
 * Comprehensive collision testing for both Timestamp and Issuer variant UUIDs.
 * Tests various scenarios including:
 * - Same issuer, different timestamps
 * - Same timestamp, different issuers
 * - High-volume generation patterns
 * - Bit pattern uniqueness
 */

import { describe, test, expect } from "vitest";
import { UUID, ISSUER_CATEGORIES } from "../src/uuid.mjs";
import { SUBVARIANT_ISSUER } from "../src/lib/constants.mjs";
import { BitUtils } from "../src/lib/bit-utils.mjs";
import crypto from "crypto";

describe("Custom UUID Collision Tests", () => {
	test("should not generate collisions for Issuer Variant UUIDs with same issuer", () => {
		const issuerID = 100;
		const version = 1;
		const count = 10000;
		const uuids = new Set();

		for (let i = 0; i < count; i++) {
			const uuid = UUID.createIssuerVariant(issuerID, version);
			const uuidStr = uuid.toString();

			expect(uuids.has(uuidStr)).toBeFalsy();
			uuids.add(uuidStr);
		}

		expect(uuids.size).toBe(count);
	});

	test("should not generate collisions across different issuer IDs", () => {
		const version = 1;
		const issuersPerCategory = 10;
		const uuidsPerIssuer = 100;
		const uuids = new Set();

		// Test Category A issuers
		for (let i = 0; i < issuersPerCategory; i++) {
			const issuerID = ISSUER_CATEGORIES.CATEGORY_A_START + i;
			for (let j = 0; j < uuidsPerIssuer; j++) {
				const uuid = UUID.createIssuerVariant(issuerID, version);
				const uuidStr = uuid.toString();
				expect(uuids.has(uuidStr)).toBeFalsy();
				uuids.add(uuidStr);
			}
		}

		// Test Category B issuers
		for (let i = 0; i < issuersPerCategory; i++) {
			const issuerID = ISSUER_CATEGORIES.CATEGORY_B_START + i;
			for (let j = 0; j < uuidsPerIssuer; j++) {
				const uuid = UUID.createIssuerVariant(issuerID, version);
				const uuidStr = uuid.toString();
				expect(uuids.has(uuidStr)).toBeFalsy();
				uuids.add(uuidStr);
			}
		}

		const expectedTotal = issuersPerCategory * 2 * uuidsPerIssuer;
		expect(uuids.size).toBe(expectedTotal);
	});

	test("should not generate collisions for Timestamp Variant UUIDs (Version 1 - seconds)", () => {
		const version = 1;
		const count = 5000;
		const uuids = new Set();
		const baseTimestamp = Date.now();

		for (let i = 0; i < count; i++) {
			const timestamp = baseTimestamp + i * 1000; // 1 second increments
			const uuid = UUID.createTimestampVariant(timestamp, version);
			const uuidStr = uuid.toString();

			expect(uuids.has(uuidStr)).toBeFalsy();
			uuids.add(uuidStr);
		}

		expect(uuids.size).toBe(count);
	});

	test("should not generate collisions for Timestamp Variant UUIDs (Version 2 - milliseconds)", () => {
		const version = 2;
		const count = 5000;
		const uuids = new Set();
		const baseTimestamp = Date.now();

		for (let i = 0; i < count; i++) {
			const timestamp = baseTimestamp + i; // 1 millisecond increments
			const uuid = UUID.createTimestampVariant(timestamp, version);
			const uuidStr = uuid.toString();

			expect(uuids.has(uuidStr)).toBeFalsy();
			uuids.add(uuidStr);
		}

		expect(uuids.size).toBe(count);
	});

	test("should not collide between timestamp version 1 and version 2 with same timestamps", () => {
		const count = 1000;
		const uuids = new Set();
		const baseTimestamp = Date.now();

		// Generate both v1 and v2 UUIDs with same timestamps
		for (let i = 0; i < count; i++) {
			const timestamp = baseTimestamp + i * 1000;
			const uuidV1 = UUID.createTimestampVariant(timestamp, 1);
			const uuidV2 = UUID.createTimestampVariant(timestamp, 2);

			const v1Str = uuidV1.toString();
			const v2Str = uuidV2.toString();

			expect(uuids.has(v1Str)).toBeFalsy();
			expect(uuids.has(v2Str)).toBeFalsy();

			uuids.add(v1Str);
			uuids.add(v2Str);
		}

		expect(uuids.size).toBe(count * 2);
	});

	test("should maintain uniqueness with rapid generation", () => {
		const issuerID = 200;
		const version = 1;
		const count = 1000;
		const uuids = new Set();
		const buffers = [];

		// Generate as fast as possible
		const start = Date.now();
		for (let i = 0; i < count; i++) {
			const uuid = UUID.createIssuerVariant(issuerID, version);
			const buffer = uuid.toBuffer();
			const hex = buffer.toString("hex");

			expect(uuids.has(hex)).toBeFalsy();
			uuids.add(hex);
			buffers.push(buffer);
		}
		const elapsed = Date.now() - start;

		expect(uuids.size).toBe(count);
		expect(elapsed).toBeLessThan(5000); // Should complete in < 5 seconds
	});

	test("should have unique entropy patterns across UUIDs", () => {
		const issuerID = 300;
		const version = 1;
		const count = 1000;
		const entropyBuffers = [];

		// Extract entropy portions (non-immutable bits) from UUIDs
		for (let i = 0; i < count; i++) {
			const uuid = UUID.createIssuerVariant(issuerID, version);
			const buffer = uuid.toBuffer();

			// Extract bits that are NOT immutable (variant, subvariant, version, issuerID)
			// Entropy should be in bits 0-63, 69-74, 88-127
			const entropyBits = [];
			for (let bit = 0; bit < 64; bit++) {
				entropyBits.push(BitUtils.getBitsAsNumber(buffer, bit, 1));
			}
			for (let bit = 69; bit < 75; bit++) {
				entropyBits.push(BitUtils.getBitsAsNumber(buffer, bit, 1));
			}
			for (let bit = 88; bit < 128; bit++) {
				entropyBits.push(BitUtils.getBitsAsNumber(buffer, bit, 1));
			}

			entropyBuffers.push(entropyBits.join(""));
		}

		// Check for uniqueness
		const uniqueEntropyPatterns = new Set(entropyBuffers);
		expect(uniqueEntropyPatterns.size).toBe(count);
	});

	test("should detect collisions in variant and subvariant fields", () => {
		const issuerID = 100;
		const version = 1;
		const count = 100;
		const variantValues = new Set();
		const subvariantValues = new Set();

		for (let i = 0; i < count; i++) {
			const uuid = UUID.createIssuerVariant(issuerID, version);
			variantValues.add(uuid.getVariant());
			subvariantValues.add(uuid.getSubvariant());
		}

		// All should have same variant (111)
		expect(variantValues.size).toBe(1);
		expect([...variantValues][0]).toBe(0b111);

		// All should have same subvariant (01 for Issuer)
		expect(subvariantValues.size).toBe(1);
		expect([...subvariantValues][0]).toBe(SUBVARIANT_ISSUER);
	});

	test("should maintain uniqueness across different versions", () => {
		const issuerID = 150;
		const uuids = new Set();

		for (let version = 0; version < 16; version++) {
			for (let i = 0; i < 100; i++) {
				const uuid = UUID.createIssuerVariant(issuerID, version);
				const uuidStr = uuid.toString();
				expect(uuids.has(uuidStr)).toBeFalsy();
				uuids.add(uuidStr);
			}
		}

		expect(uuids.size).toBe(1600);
	});

	test("should maintain uniqueness with custom entropy", () => {
		const issuerID = 250;
		const version = 1;
		const count = 1000;
		const uuids = new Set();

		for (let i = 0; i < count; i++) {
			// Generate custom entropy
			const entropy = crypto.randomBytes(16);
			const uuid = UUID.createIssuerVariant(issuerID, version, entropy);
			const uuidStr = uuid.toString();

			expect(uuids.has(uuidStr)).toBeFalsy();
			uuids.add(uuidStr);
		}

		expect(uuids.size).toBe(count);
	});

	test("should test bit distribution quality in generated UUIDs", () => {
		const issuerID = 350;
		const version = 1;
		const count = 1000;
		let totalSetBits = 0;
		let totalBits = 0;

		for (let i = 0; i < count; i++) {
			const uuid = UUID.createIssuerVariant(issuerID, version);
			const buffer = uuid.toBuffer();

			// Count set bits in entropy regions only
			for (let bit = 0; bit < 64; bit++) {
				const bitVal = BitUtils.getBitsAsNumber(buffer, bit, 1);
				if (bitVal) totalSetBits++;
				totalBits++;
			}
			for (let bit = 69; bit < 75; bit++) {
				const bitVal = BitUtils.getBitsAsNumber(buffer, bit, 1);
				if (bitVal) totalSetBits++;
				totalBits++;
			}
			for (let bit = 88; bit < 128; bit++) {
				const bitVal = BitUtils.getBitsAsNumber(buffer, bit, 1);
				if (bitVal) totalSetBits++;
				totalBits++;
			}
		}

		const ratio = totalSetBits / totalBits;
		// Expect roughly 50% set bits (within 10% tolerance)
		expect(ratio).toBeGreaterThan(0.4);
		expect(ratio).toBeLessThan(0.6);
	});

	test("should handle collision testing at scale (100K UUIDs)", () => {
		const issuerID = 400;
		const version = 1;
		const count = 100000;
		const uuids = new Set();

		const start = Date.now();
		for (let i = 0; i < count; i++) {
			const uuid = UUID.createIssuerVariant(issuerID, version);
			const uuidStr = uuid.toString();

			expect(uuids.has(uuidStr)).toBeFalsy();
			uuids.add(uuidStr);

			// Sample check every 10K
			if ((i + 1) % 10000 === 0) {
				expect(uuids.size).toBe(i + 1);
			}
		}
		const elapsed = Date.now() - start;

		expect(uuids.size).toBe(count);
		console.log(`Generated ${count} unique UUIDs in ${elapsed}ms (${Math.round(count / (elapsed / 1000))} UUIDs/sec)`);
	});

	test("should verify immutable fields remain constant during collision test", () => {
		const issuerID = 450;
		const version = 3;
		const count = 1000;

		for (let i = 0; i < count; i++) {
			const uuid = UUID.createIssuerVariant(issuerID, version);

			expect(uuid.getVariant()).toBe(0b111);
			expect(uuid.getSubvariant()).toBe(SUBVARIANT_ISSUER);
			expect(uuid.getVersion()).toBe(version);
			expect(uuid.getIssuerID()).toBe(issuerID);
		}
	});

	test("should test timestamp ordering with collision detection (Version 1)", () => {
		const version = 1;
		const count = 1000;
		const baseTimestamp = Date.now();
		const uuids = [];

		for (let i = 0; i < count; i++) {
			const timestamp = baseTimestamp + i * 1000; // 1 second apart
			const uuid = UUID.createTimestampVariant(timestamp, version);
			uuids.push({
				uuid: uuid.toString(),
				timestamp,
				buffer: uuid.toBuffer()
			});
		}

		// Check for collisions
		const uuidSet = new Set(uuids.map((u) => u.uuid));
		expect(uuidSet.size).toBe(count);

		// Verify lexicographic ordering matches timestamp ordering
		const sortedByUUID = [...uuids].sort((a, b) => a.uuid.localeCompare(b.uuid));
		const sortedByTimestamp = [...uuids].sort((a, b) => a.timestamp - b.timestamp);

		for (let i = 0; i < count; i++) {
			expect(sortedByUUID[i].timestamp).toBe(sortedByTimestamp[i].timestamp);
		}
	});

	test("should test timestamp ordering with collision detection (Version 2)", () => {
		const version = 2;
		const count = 1000;
		const baseTimestamp = Date.now();
		const uuids = [];

		for (let i = 0; i < count; i++) {
			const timestamp = baseTimestamp + i; // 1 millisecond apart
			const uuid = UUID.createTimestampVariant(timestamp, version);
			uuids.push({
				uuid: uuid.toString(),
				timestamp,
				buffer: uuid.toBuffer()
			});
		}

		// Check for collisions
		const uuidSet = new Set(uuids.map((u) => u.uuid));
		expect(uuidSet.size).toBe(count);

		// Verify lexicographic ordering matches timestamp ordering
		const sortedByUUID = [...uuids].sort((a, b) => a.uuid.localeCompare(b.uuid));
		const sortedByTimestamp = [...uuids].sort((a, b) => a.timestamp - b.timestamp);

		for (let i = 0; i < count; i++) {
			expect(sortedByUUID[i].timestamp).toBe(sortedByTimestamp[i].timestamp);
		}
	});

	test("should test parallel generation collision resistance", () => {
		const issuerID = 550;
		const version = 1;
		const batchSize = 100;
		const batchCount = 10;
		const allUUIDs = new Set();

		// Simulate parallel generation by creating batches "simultaneously"
		const batches = [];
		for (let b = 0; b < batchCount; b++) {
			const batch = [];
			for (let i = 0; i < batchSize; i++) {
				const uuid = UUID.createIssuerVariant(issuerID, version);
				batch.push(uuid.toString());
			}
			batches.push(batch);
		}

		// Check for collisions across all batches
		for (const batch of batches) {
			for (const uuid of batch) {
				expect(allUUIDs.has(uuid)).toBeFalsy();
				allUUIDs.add(uuid);
			}
		}

		expect(allUUIDs.size).toBe(batchSize * batchCount);
	});
});
