/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /tests/timestamp-migrate.test.vitest.mjs
 *	@Date: 2026-11-02T20:26:31-08:00 (1793679991)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-02T21:25:22-08:00 (1793683522)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

import { describe, expect, test } from "vitest";
import { randomBytes } from "node:crypto";
import { UUID } from "../src/uuid.mjs";
import { BitUtils } from "../src/lib/bit-utils.mjs";

const LEGACY_TB = "e7f2b400-0000-018b-e005-c289f23865d3"; // version 2, 1700000000000
const LEGACY_TA = "b2a9f880-0000-0000-e003-75f9d411b1d3"; // version 1, 1700000000

// bits 79-127 as a bigint
const entropyOf = (uuid) => BitUtils.getBits(uuid.toBuffer(), 79, 49);

describe("UUID.migrate", () => {
	test.each([
		["TB", LEGACY_TB, 2, 4, 1700000000000, (ts, entropy) => UUID.TB(ts, entropy)],
		["TA", LEGACY_TA, 1, 3, 1700000000, (ts, entropy) => UUID.TA(ts, entropy)]
	])("%s legacy vector migrates to the ordered layout", (_label, legacy, fromVersion, toVersion, timestamp, mint) => {
		const source = new UUID(legacy);
		expect(source.getVersion()).toBe(fromVersion);
		expect(source.isLegacyTimestampLayout()).toBe(true);

		const migrated = UUID.migrate(source);
		expect(migrated).toBeInstanceOf(UUID);
		expect(migrated).not.toBe(source);
		expect(migrated.getVersion()).toBe(toVersion);
		expect(migrated.isLegacyTimestampLayout()).toBe(false);
		expect(migrated.getTimestamp()).toBe(timestamp);
		expect(entropyOf(migrated)).toBe(entropyOf(source));

		// the source instance is not modified
		expect(source.toString()).toBe(legacy);

		// the same string as minting fresh with the source as the entropy
		expect(migrated.toString()).toBe(mint(timestamp, source.toBuffer()).toString());

		// strings and buffers migrate to the same id
		expect(UUID.migrate(legacy).toString()).toBe(migrated.toString());
		expect(UUID.migrate(source.toBuffer()).toString()).toBe(migrated.toString());
		expect(UUID.migrate(new Uint8Array(source.toBuffer())).toString()).toBe(migrated.toString());
	});

	test("is idempotent", () => {
		for (const legacy of [LEGACY_TB, LEGACY_TA]) {
			const once = UUID.migrate(legacy);
			const twice = UUID.migrate(once);
			expect(twice).not.toBe(once);
			expect(twice.toString()).toBe(once.toString());
		}
		const fresh = UUID.TB(1700000000000);
		expect(UUID.migrate(fresh).toString()).toBe(fresh.toString());
		expect(UUID.migrate(fresh)).not.toBe(fresh);
	});

	test("non-timestamp ids pass through unchanged", () => {
		const rfc = UUID.v4();
		const rfcString = typeof rfc === "string" ? rfc : rfc.toString();
		expect(UUID.migrate(rfcString).toString()).toBe(rfcString);
		const issuer = UUID.IA(404);
		expect(UUID.migrate(issuer).toString()).toBe(issuer.toString());
		expect(UUID.migrate(issuer.toBuffer()).toString()).toBe(issuer.toString());
		expect(new UUID(rfcString).isLegacyTimestampLayout()).toBe(false);
		expect(issuer.isLegacyTimestampLayout()).toBe(false);
	});

	test("timestamp versions other than 1 and 2 pass through unchanged", () => {
		for (const version of [3, 4, 5]) {
			const uuid = UUID.timestamp(1700000000000, version);
			expect(UUID.migrate(uuid).toString()).toBe(uuid.toString());
			expect(uuid.isLegacyTimestampLayout()).toBe(false);
		}
	});

	test("negative and extreme magnitudes keep their value and entropy", () => {
		for (const [ts, version] of [
			[-315619200000, 2],
			[-1, 2],
			[0, 1],
			[-86400, 1],
			[2 ** 53 - 1, 2]
		]) {
			const source = UUID.timestamp(ts, version);
			const migrated = UUID.migrate(source);
			expect(migrated.getVersion()).toBe(version + 2);
			expect(migrated.getTimestamp()).toBe(source.getTimestamp());
			expect(entropyOf(migrated)).toBe(entropyOf(source));
			expect(BitUtils.getBitsAsNumber(migrated.toBuffer(), 0, 1)).toBe(BitUtils.getBitsAsNumber(source.toBuffer(), 0, 1));
		}
	});

	test("throws only on unparseable input", () => {
		expect(() => UUID.migrate("not-a-uuid")).toThrow();
		expect(() => UUID.migrate(new Uint8Array(4))).toThrow();
		expect(() => UUID.migrate(42)).toThrow();
		expect(() => UUID.migrate(null)).not.toThrow(); // an all-zero id is a valid, non-timestamp input
	});

	test("1000 random legacy ids sorted by byte order after migration match the timestamp order", () => {
		const sample = [];
		for (let i = 0; i < 1000; i++) {
			// spread across ~300 years so the legacy 2^32 rollover is crossed many times
			const timestamp = -4_000_000_000_000 + Math.floor(Math.random() * 14_000_000_000_000) + i * 0; // unique-ish below
			sample.push({ timestamp, uuid: UUID.timestamp(timestamp, 2, randomBytes(16)) });
		}
		// the legacy layout does not sort by timestamp, which is the problem the migration fixes
		const legacyOrder = [...sample].sort((a, b) => Buffer.compare(a.uuid.toBuffer(), b.uuid.toBuffer())).map((x) => x.timestamp);
		const byTimestamp = [...sample].sort((a, b) => a.timestamp - b.timestamp).map((x) => x.timestamp);
		expect(legacyOrder).not.toEqual(byTimestamp);

		const migrated = sample.map(({ timestamp, uuid }) => ({ timestamp, uuid: UUID.migrate(uuid) }));
		const migratedOrder = migrated.sort((a, b) => Buffer.compare(a.uuid.toBuffer(), b.uuid.toBuffer())).map((x) => x.timestamp);
		expect(migratedOrder).toEqual(byTimestamp);
		for (const { timestamp, uuid } of migrated) {
			expect(uuid.getTimestamp()).toBe(timestamp);
		}
	});
});

describe("UUID#isLegacyTimestampLayout", () => {
	test("is true for timestamp versions 1 and 2 only", () => {
		expect(UUID.timestamp(1700000000, 1).isLegacyTimestampLayout()).toBe(true);
		expect(UUID.timestamp(1700000000000, 2).isLegacyTimestampLayout()).toBe(true);
		expect(UUID.TA().isLegacyTimestampLayout()).toBe(false);
		expect(UUID.TB().isLegacyTimestampLayout()).toBe(false);
	});
});
