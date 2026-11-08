/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /tests/timestamp-order.test.vitest.mjs
 *	@Date: 2026-11-02T20:26:31-08:00 (1793679991)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-07T21:23:43-08:00 (1794115423)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

import { describe, expect, test } from "vitest";
import { UUID } from "@cldmv/uuid";
import { UUIDValidator } from "../src/lib/validators.mjs";

const TWO_POW_32 = 2 ** 32;

// 16 bytes of 0xaa: bits 79-127 are all entropy, so the id below is fully reproducible
const ENTROPY = new Uint8Array(16).fill(0xaa);

// Byte order (and therefore the hex string order and a database's uuid order)
// must follow the timestamp order across every 2^32 boundary of the
// magnitude, not only inside one window. Versions 1 and 2 wrote the lower 32
// bits in front of the upper 31, so their order rolled over every 2^32 units:
// 49.7 days for milliseconds, 136 years for seconds. Versions 3 and 4 write
// the magnitude most significant bit first; TA() mints 3 and TB() mints 4.
describe("timestamp variants sort by byte order", () => {
	test("TA() mints version 3 and TB() mints version 4", () => {
		expect(UUID.TA().getVersion()).toBe(3);
		expect(UUID.TB().getVersion()).toBe(4);
		expect(UUID.TA().version()).toBe("TA");
		expect(UUID.TB().version()).toBe("TB");
	});

	test("TB: fixed vector lays the magnitude out most significant bit first", () => {
		const uuid = UUID.TB(1700000000000); // 0x18b_cfe56800
		expect(uuid.toString().slice(0, 18)).toBe("8000018b-cfe5-6800");
		expect(uuid.getVersion()).toBe(4);
		expect(uuid.getTimestamp()).toBe(1700000000000);
	});

	test("TA: fixed vector lays the magnitude out most significant bit first", () => {
		const uuid = UUID.TA(1700000000); // 0x6553f100
		expect(uuid.toString().slice(0, 18)).toBe("80000000-6553-f100");
		expect(uuid.getVersion()).toBe(3);
		expect(uuid.getTimestamp()).toBe(1700000000);
	});

	// Group 4 is e0 plus the version shifted left one bit (bits 75-78) plus entropy bit 79.
	// Version 4 gives 0x08 where the version 2 id had 0x04, version 3 gives 0x06 where version 1 had 0x02,
	// so with the all-0xaa entropy (bit 79 = 0) group 4 is e008 / e006.
	test("full fixed vectors with explicit entropy", () => {
		expect(UUID.TB(1700000000000, ENTROPY).toString()).toBe("8000018b-cfe5-6800-e008-aaaaaaaaaaaa");
		expect(UUID.TA(1700000000, ENTROPY).toString()).toBe("80000000-6553-f100-e006-aaaaaaaaaaaa");
	});

	test.each([
		["TB", (t) => UUID.TB(t), TWO_POW_32 * 395], // 2026-ish millisecond boundary
		["TB", (t) => UUID.TB(t), TWO_POW_32 * 396],
		["TA", (t) => UUID.TA(t), TWO_POW_32] // the 2106 second boundary
	])("%s orders across the 2^32 boundary at %d", (_label, make, boundary) => {
		const before = make(boundary - 1).toString();
		const at = make(boundary).toString();
		const after = make(boundary + 1).toString();
		expect(before < at).toBe(true);
		expect(at < after).toBe(true);
		expect(make(boundary - 1).getTimestamp()).toBe(boundary - 1);
		expect(make(boundary + 1).getTimestamp()).toBe(boundary + 1);
	});

	test("TB: random increasing timestamps over three centuries keep byte order", () => {
		let previous = null;
		let timestamp = -4_000_000_000_000; // 1843
		for (let i = 0; i < 5000; i++) {
			timestamp += 1 + Math.floor(Math.random() * 2_000_000_000); // up to ~23 days per step
			const current = UUID.TB(timestamp);
			expect(current.getTimestamp()).toBe(timestamp);
			if (previous !== null) {
				expect(Buffer.compare(previous.toBuffer(), current.toBuffer())).toBeLessThan(0);
			}
			previous = current;
		}
	});

	test("negative timestamps sort below positive ones and among themselves", () => {
		const a = UUID.TB(-315619200000); // 1960
		const b = UUID.TB(-1);
		const c = UUID.TB(0);
		const d = UUID.TB(1);
		const strings = [d, b, c, a].map((u) => u.toString()).sort();
		expect(strings).toEqual([a, b, c, d].map((u) => u.toString()));
		expect(a.getTimestamp()).toBe(-315619200000);
		expect(b.getTimestamp()).toBe(-1);
	});
});

// Ids minted by 1.3.1 and earlier carry versions 1 and 2 and the low-word-first layout.
// They must keep decoding to the timestamp they were minted with.
describe("legacy versions 1 and 2 still decode", () => {
	test("version 2 id minted by 1.3.1 decodes to its millisecond timestamp", () => {
		const uuid = new UUID("e7f2b400-0000-018b-e005-c289f23865d3");
		expect(uuid.getVersion()).toBe(2);
		expect(uuid.version()).toBe("TB");
		expect(uuid.getTimestamp()).toBe(1700000000000);
	});

	test("version 1 id minted by 1.3.1 decodes to its second timestamp", () => {
		const uuid = new UUID("b2a9f880-0000-0000-e003-75f9d411b1d3");
		expect(uuid.getVersion()).toBe(1);
		expect(uuid.version()).toBe("TA");
		expect(uuid.getTimestamp()).toBe(1700000000);
	});

	test("explicit version 2 mints the legacy layout and decodes back", () => {
		const uuid = UUID.timestamp(1700000000000, 2);
		expect(uuid.toString().startsWith("e7f2b400-0000-018b")).toBe(true);
		expect(uuid.getVersion()).toBe(2);
		expect(uuid.getTimestamp()).toBe(1700000000000);
		expect(UUID.createTimestampVariant(1700000000000, 2).getTimestamp()).toBe(1700000000000);
	});

	test("explicit version 1 mints the legacy layout and decodes back", () => {
		const uuid = UUID.timestamp(1700000000, 1);
		expect(uuid.toString().startsWith("b2a9f880-0000-0000")).toBe(true);
		expect(uuid.getVersion()).toBe(1);
		expect(uuid.getTimestamp()).toBe(1700000000);
	});

	test("explicit versions 3 and 4 mint the ordered layout", () => {
		expect(UUID.timestamp(1700000000000, 4).toString().startsWith("8000018b-cfe5-6800")).toBe(true);
		expect(UUID.timestamp(1700000000, 3).toString().startsWith("80000000-6553-f100")).toBe(true);
	});

	test("precision follows the version: 1 and 3 seconds, 2 and 4 milliseconds", () => {
		const date = new Date(1700000000999);
		expect(UUID.timestamp(date, 1).getTimestamp()).toBe(1700000000);
		expect(UUID.timestamp(date, 3).getTimestamp()).toBe(1700000000);
		expect(UUID.timestamp(date, 2).getTimestamp()).toBe(1700000000999);
		expect(UUID.timestamp(date, 4).getTimestamp()).toBe(1700000000999);
		const now = Math.floor(Date.now() / 1000);
		for (const version of [1, 3]) {
			expect(Math.abs(UUID.timestamp(null, version).getTimestamp() - now)).toBeLessThan(5);
		}
		for (const version of [2, 4]) {
			expect(Math.abs(UUID.timestamp(undefined, version).getTimestamp() - Date.now())).toBeLessThan(5000);
		}
	});

	test("legacy negative timestamps round trip", () => {
		expect(UUID.timestamp(-315619200000, 2).getTimestamp()).toBe(-315619200000);
		expect(UUID.timestamp(-315619200, 1).getTimestamp()).toBe(-315619200);
	});

	test("validators read the magnitude with the layout of the version", () => {
		for (const [version, ts] of [
			[1, 1700000000],
			[2, 1700000000000],
			[3, 1700000000],
			[4, 1700000000000]
		]) {
			const result = UUIDValidator.validateCompleteUUID(UUID.timestamp(ts, version).toBuffer());
			expect(result.isValid).toBe(true);
			expect(result.fields.actualTimestamp).toBe(BigInt(ts));
		}
	});
});
