/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /tests/timestamp-range.test.vitest.mjs
 *	@Date: 2026-11-21T12:52:13-08:00 (1795294333)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-21T12:52:13-08:00 (1795294333)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * The Timestamp Variant holds a sign bit and a 69-bit magnitude, so every whole
 * number in ±(2^69 - 1) has to go in and come back out exactly, from a number,
 * bigint, decimal string or Date, and anything the format can't hold has to
 * throw rather than encode a different time (#100).
 */

import { describe, expect, test } from "vitest";
import { UUID } from "@cldmv/uuid";
import { EntropySource } from "../src/lib/entropy-sources.mjs";
import { toTimestampBigInt } from "../src/lib/timestamp.mjs";
import {
	v1,
	v2,
	v3,
	v4,
	v5,
	v6,
	parseTimestampV1,
	parseTimestampV2,
	parseTimestampV3,
	parseTimestampV4,
	parseTimestampV5,
	parseTimestampV6
} from "../src/lib/versions/timestamp/index.mjs";

const MAX = 2n ** 69n - 1n;

// Edge points of the format, both signs
const POINTS = [0n, 1n, 2n ** 53n - 1n, 2n ** 53n, 2n ** 63n - 1n, 2n ** 63n, 2n ** 68n, MAX].flatMap((v) => (v === 0n ? [v] : [v, -v]));

const VERSIONS = [
	["TA (v5)", 5, (ts) => UUID.TA(ts)],
	["TB (v6)", 6, (ts) => UUID.TB(ts)],
	["legacy v1", 1, (ts) => UUID.timestamp(ts, 1)],
	["legacy v2", 2, (ts) => UUID.timestamp(ts, 2)],
	["ordered v3", 3, (ts) => UUID.timestamp(ts, 3)],
	["ordered v4", 4, (ts) => UUID.timestamp(ts, 4)]
];

const expectedNumberOrBigInt = (v) => (v >= -(2n ** 53n - 1n) && v <= 2n ** 53n - 1n ? Number(v) : v);

describe("timestamp round-trips across the whole 70-bit range", () => {
	describe.each(VERSIONS)("%s", (_name, version, mint) => {
		test.each(POINTS.map((v) => [v]))("bigint %s", (value) => {
			const uuid = mint(value);
			expect(uuid.getVersion()).toBe(version);
			expect(uuid.getTimestampBigInt()).toBe(value);
			expect(uuid.getTimestamp()).toBe(expectedNumberOrBigInt(value));
			// Parsing the string form gives the same value back
			expect(new UUID(uuid.toString()).getTimestampBigInt()).toBe(value);
		});

		test.each(POINTS.map((v) => [v]))("decimal string %s", (value) => {
			expect(mint(value.toString()).getTimestampBigInt()).toBe(value);
		});

		test.each(POINTS.filter((v) => Number.isSafeInteger(Number(v)) || BigInt(Number(v)) === v).map((v) => [v]))("number %s", (value) => {
			expect(mint(Number(value)).getTimestampBigInt()).toBe(value);
		});
	});

	test("getTimestamp() is a number up to ±(2^53 - 1) and a bigint past it", () => {
		expect(UUID.TB(Number.MAX_SAFE_INTEGER).getTimestamp()).toBe(Number.MAX_SAFE_INTEGER);
		expect(UUID.TB(-Number.MAX_SAFE_INTEGER).getTimestamp()).toBe(-Number.MAX_SAFE_INTEGER);
		expect(UUID.TB(2n ** 53n).getTimestamp()).toBe(2n ** 53n);
		expect(UUID.TB(-(2n ** 53n)).getTimestamp()).toBe(-(2n ** 53n));
		expect(typeof UUID.TB(1700000000000).getTimestamp()).toBe("number");
	});

	test("number inputs past 2^53 are taken exactly as the double they are", () => {
		expect(UUID.TB(2 ** 60).getTimestampBigInt()).toBe(2n ** 60n);
		expect(UUID.TA(-(2 ** 68)).getTimestampBigInt()).toBe(-(2n ** 68n));
	});

	test("getTimestampBigInt() is null for Issuer Variants", () => {
		expect(UUID.IA(404).getTimestampBigInt()).toBeNull();
		expect(UUID.IA(404).getTimestamp()).toBeNull();
	});

	test("getInfo() carries the exact timestamp", () => {
		expect(UUID.TB(MAX).getInfo().timestamp).toBe(MAX);
		expect(UUID.TB(-5).getInfo().timestamp).toBe(-5);
	});
});

describe("timestamp inputs", () => {
	test("fractional numbers floor toward -Infinity", () => {
		expect(UUID.TB(1.5).getTimestamp()).toBe(1);
		expect(UUID.TB(-0.5).getTimestamp()).toBe(-1);
		expect(UUID.TB(-1.5).getTimestamp()).toBe(-2);
		// -0.5 is before 0, so it has to sort before it
		expect(UUID.TB(-0.5).toString() < UUID.TB(0).toString()).toBe(true);
	});

	test("-0 encodes as 0", () => {
		expect(UUID.TB(-0).toString().slice(0, 18)).toBe(UUID.TB(0).toString().slice(0, 18));
		expect(Object.is(UUID.TB(-0).getTimestamp(), 0)).toBe(true);
	});

	test("a Date is milliseconds for TB and floored seconds for TA, before 1970 too", () => {
		const before = new Date(-1500); // 1969-12-31T23:59:58.500Z
		expect(UUID.TB(before).getTimestamp()).toBe(-1500);
		expect(UUID.TA(before).getTimestamp()).toBe(-2);
		const max = new Date(8.64e15);
		expect(UUID.TB(max).getTimestamp()).toBe(8.64e15);
		expect(UUID.TA(new Date(-8.64e15 + 1)).getTimestamp()).toBe(-8.64e12);
		expect(UUID.TA(new Date(1999)).getTimestamp()).toBe(1);
	});

	test.each([
		["2^69", 2n ** 69n],
		["-(2^69)", -(2n ** 69n)],
		["2^70 as a number", 2 ** 70],
		["string past the range", (2n ** 69n).toString()],
		["NaN", NaN],
		["Infinity", Infinity],
		["-Infinity", -Infinity],
		["exponent string", "1.7e12"],
		["fractional string", "1.5"],
		["empty string", ""],
		["string with spaces", " 12"],
		["invalid Date", new Date("not a date")]
	])("%s throws a RangeError", (_name, value) => {
		expect(() => UUID.TB(value)).toThrow(RangeError);
		expect(() => UUID.TA(value)).toThrow(RangeError);
	});

	test.each([
		["boolean", true],
		["object", {}],
		["array", [1]]
	])("%s throws a TypeError", (_name, value) => {
		expect(() => UUID.TB(value)).toThrow(TypeError);
	});

	test("the TypeError names null when the helper is handed null directly", () => {
		expect(() => toTimestampBigInt(null)).toThrow(/got null/);
		expect(() => toTimestampBigInt(true)).toThrow(/got boolean/);
	});

	test("null and undefined still mean now", () => {
		expect(Math.abs(UUID.TB(null).getTimestamp() - Date.now())).toBeLessThan(5000);
		expect(Math.abs(UUID.TA(undefined).getTimestamp() - Date.now() / 1000)).toBeLessThan(5);
	});
});

describe("byte order", () => {
	const ACROSS_THE_RANGE = [
		-MAX,
		-(2n ** 68n),
		-(2n ** 63n) - 1n,
		-(2n ** 63n) + 1n,
		-(2n ** 53n),
		-1700000000000n,
		-2n,
		-1n,
		0n,
		1n,
		63n,
		64n,
		1700000000000n,
		2n ** 53n,
		2n ** 63n - 1n,
		2n ** 63n,
		2n ** 63n + 1700000000000n,
		2n ** 68n,
		MAX
	];

	test("TA and TB (versions 5 and 6) sort by time across the whole ±(2^69 - 1)", () => {
		for (const mint of [UUID.TA, UUID.TB]) {
			const ids = ACROSS_THE_RANGE.map((v) => mint(v).toString());
			expect([...ids].sort()).toEqual(ids);
		}
	});

	test("versions 3 and 4 sort by time within ±(2^63 - 1)", () => {
		const values = [-(2n ** 63n) + 1n, -(2n ** 53n), -1700000000000n, -2n, -1n, 0n, 1n, 1700000000000n, 2n ** 53n, 2n ** 63n - 1n];
		for (const version of [3, 4]) {
			const ids = values.map((v) => UUID.timestamp(v, version).toString());
			expect([...ids].sort()).toEqual(ids);
		}
	});

	test("versions 3 and 4 lose byte order past 2^63, which UUID.compare restores", () => {
		const values = [1700000000000n, 2n ** 63n - 1n, 2n ** 63n, 2n ** 63n + 1700000000000n];
		const ids = values.map((v) => UUID.timestamp(v, 4));
		const byBytes = [...ids].sort((a, b) => Buffer.compare(a.toBuffer(), b.toBuffer()));
		expect(byBytes.map((u) => u.getTimestampBigInt())).not.toEqual(values);
		expect(
			[...ids]
				.reverse()
				.sort(UUID.compare)
				.map((u) => u.getTimestampBigInt())
		).toEqual(values);
	});
});

describe("UUID.compare", () => {
	test("orders a mix of layouts and precisions by time", () => {
		const ids = [
			UUID.timestamp(-(2n ** 68n), 4), // ms
			UUID.timestamp(-5, 1), // -5000 ms
			UUID.TB(-1),
			UUID.timestamp(0, 2),
			UUID.TA(0), // 0 ms, ties with the line above and falls back to bytes
			UUID.timestamp(999, 4),
			UUID.TA(1), // 1000 ms
			UUID.timestamp(2n ** 63n + 1n, 4),
			UUID.TB(MAX),
			UUID.timestamp(2n ** 63n, 3) // 2^63 seconds is later than 2^69 - 1 milliseconds
		];
		const shuffled = [...ids].reverse();
		const sorted = shuffled.sort(UUID.compare);
		const times = sorted.map((u) => u._sortTime());
		for (let i = 1; i < times.length; i++) {
			expect(times[i - 1] <= times[i]).toBe(true);
		}
		expect(sorted.map((u) => u.toString())).toEqual(ids.map((u) => u.toString()).sort((x, y) => UUID.compare(x, y)));
		expect(sorted[sorted.length - 1].getVersion()).toBe(3);
		expect(sorted[sorted.length - 2].getTimestampBigInt()).toBe(MAX);
		expect(sorted[0].getTimestampBigInt()).toBe(-(2n ** 68n));
	});

	test("takes instances, strings and buffers and returns -1, 0 or 1", () => {
		const a = UUID.TB(1);
		const b = UUID.TB(2);
		expect(UUID.compare(a, b)).toBe(-1);
		expect(UUID.compare(b.toString(), a.toBuffer())).toBe(1);
		expect(UUID.compare(a.toString(), new Uint8Array(a.toBuffer()))).toBe(0);
	});

	test("equal times fall back to byte order", () => {
		const low = UUID.TB(5, new Uint8Array(16).fill(0x00));
		const high = UUID.TB(5, new Uint8Array(16).fill(0xff));
		expect(UUID.compare(low, high)).toBe(-1);
		expect(UUID.compare(high, low)).toBe(1);
	});

	test("non-timestamp ids sort after every timestamp id, by bytes among themselves", () => {
		const rfc = UUID.v4();
		const issuer = UUID.IA(404);
		const late = UUID.TB(MAX);
		expect(UUID.compare(late, rfc)).toBe(-1);
		expect(UUID.compare(issuer, late)).toBe(1);
		const sign = Math.sign(Buffer.compare(Buffer.from(String(rfc).replaceAll("-", ""), "hex"), Buffer.from(issuer.toBuffer())));
		expect(UUID.compare(rfc, issuer)).toBe(sign);
	});
});

describe("UUID.migrate keeps the full range", () => {
	test.each([
		[1, 5],
		[2, 6],
		[3, 5],
		[4, 6]
	])("version %i to %i", (from, to) => {
		for (const value of [MAX, -MAX, 2n ** 63n, -(2n ** 53n), -1n]) {
			const migrated = UUID.migrate(UUID.timestamp(value, from));
			expect(migrated.getVersion()).toBe(to);
			expect(migrated.getTimestampBigInt()).toBe(value);
		}
	});
});

describe("version modules", () => {
	test.each([
		["v1", v1, parseTimestampV1],
		["v2", v2, parseTimestampV2],
		["v3", v3, parseTimestampV3],
		["v4", v4, parseTimestampV4],
		["v5", v5, parseTimestampV5],
		["v6", v6, parseTimestampV6]
	])("%s round-trips every input type and rejects out-of-range values", (_name, mint, parse) => {
		for (const value of POINTS) {
			expect(parse(mint(value))).toBe(expectedNumberOrBigInt(value));
			expect(parse(mint(value.toString()))).toBe(expectedNumberOrBigInt(value));
		}
		expect(parse(mint(-0.5))).toBe(-1);
		// no timestamp means now, in the version's unit
		const now = parse === parseTimestampV1 || parse === parseTimestampV3 || parse === parseTimestampV5 ? Date.now() / 1000 : Date.now();
		expect(Math.abs(Number(parse(mint())) - now)).toBeLessThan(5000);
		expect(Math.abs(Number(parse(mint(undefined))) - now)).toBeLessThan(5000);
		expect(() => mint(2n ** 69n)).toThrow(RangeError);
		expect(() => mint(NaN)).toThrow(RangeError);
	});

	test("the module and the UUID class write the same bits", () => {
		const entropy = new Uint8Array(16).fill(0x5a);
		for (const value of [MAX, -MAX, -1n, 1700000000000n]) {
			expect(Buffer.from(v6(value, entropy)).toString("hex")).toBe(UUID.TB(value, entropy).toString().replaceAll("-", ""));
			expect(Buffer.from(v5(value, entropy)).toString("hex")).toBe(UUID.TA(value, entropy).toString().replaceAll("-", ""));
			for (const [version, mint] of [
				[1, v1],
				[2, v2],
				[3, v3],
				[4, v4]
			]) {
				expect(Buffer.from(mint(value, entropy)).toString("hex")).toBe(
					UUID.timestamp(value, version, entropy).toString().replaceAll("-", "")
				);
			}
		}
	});
});

describe("createTimestampIndependentEntropy", () => {
	test("accepts every input type across the range", () => {
		for (const value of [MAX, -MAX, -1n, "-1700000000000", -1700000000000, new Date(-1)]) {
			expect(EntropySource.createTimestampIndependentEntropy(value).length).toBe(32);
		}
	});

	test("rejects values the format can't hold", () => {
		expect(() => EntropySource.createTimestampIndependentEntropy(2n ** 69n)).toThrow(RangeError);
		expect(() => EntropySource.createTimestampIndependentEntropy(NaN)).toThrow(RangeError);
	});
});
