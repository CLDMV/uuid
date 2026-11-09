/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /tests/entropy.test.vitest.mjs
 *	@Date: 2026-11-09T10:00:00-08:00 (1794247200)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-09T10:00:00-08:00 (1794247200)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * UUID.entropy() — the TA/TB entropy builder (uuid#102).
 *
 * The helper keeps per-process clock state, so every test loads a fresh copy of
 * src/lib/entropy.mjs (vi.resetModules + dynamic import) and pins Date.now().
 */

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { UUID } from "@cldmv/uuid";
import { sha1 } from "@cldmv/uuid/hash";
import { toHex } from "@cldmv/uuid/bytes";

const T = 1794247200123; // a fixed millisecond

/**
 * Load a fresh copy of the entropy module (clean clock state).
 * @returns {Promise<typeof import("../src/lib/entropy.mjs")>}
 */
async function fresh() {
	vi.resetModules();
	return import("../src/lib/entropy.mjs");
}

/**
 * Split the 49 entropy bits of a result into its three fields.
 * @param {Uint8Array} e - Entropy bytes
 * @returns {{ counter: number, seed: number, random: number }}
 */
function fields(e) {
	let value = e[9] & 1;
	for (let i = 10; i < 16; i++) value = value * 256 + e[i];
	return {
		counter: Math.floor(value / 2 ** 37),
		seed: Math.floor(value / 2 ** 21) % 2 ** 16,
		random: value % 2 ** 21
	};
}

/**
 * The 16 seed bits the helper should derive for a string seed.
 * @param {string} seed - Seed string
 * @returns {number}
 */
function expectedSeedBits(seed) {
	const digest = sha1(new Uint8Array(0), seed);
	return (digest[0] << 8) | digest[1];
}

/**
 * Pin Date.now() to a sequence: `values[i]` for the i-th read, the last value afterwards.
 * @param {...number} values - Clock readings
 */
function clock(...values) {
	let i = 0;
	return vi.spyOn(Date, "now").mockImplementation(() => values[Math.min(i++, values.length - 1)]);
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("shape", () => {
	beforeEach(() => clock(T));

	test("returns 16 bytes with only bits 79-127 set and the tick as .timestamp", async () => {
		const { entropy } = await fresh();
		const e = entropy();
		expect(e).toBeInstanceOf(Uint8Array);
		expect(e.length).toBe(16);
		expect(Array.from(e.subarray(0, 9))).toEqual(new Array(9).fill(0));
		expect(e[9] & 0xfe).toBe(0);
		expect(e.timestamp).toBe(T);
	});

	test("the field widths add up to the 49 bits TA/TB keep", async () => {
		const { COUNTER_BITS, SEED_BITS, RANDOM_BITS } = await fresh();
		expect(COUNTER_BITS + SEED_BITS + RANDOM_BITS).toBe(49);
	});

	test("UUID.entropy is the same helper", () => {
		const e = UUID.entropy({ seed: "x" });
		expect(e.length).toBe(16);
		expect(fields(e).seed).toBe(expectedSeedBits("x"));
	});
});

describe("uniqueness at millisecond precision", () => {
	test("many calls in one millisecond with one seed never repeat", async () => {
		clock(T);
		const { entropy } = await fresh();
		const seen = new Set();
		let previous = null;
		for (let i = 0; i < 2048; i++) {
			const e = entropy({ seed: "rummage · main" });
			expect(e.timestamp).toBe(T);
			seen.add(toHex(e));
			const { counter, seed } = fields(e);
			expect(seed).toBe(expectedSeedBits("rummage · main"));
			if (previous !== null) expect(counter).toBe(previous + 1);
			previous = counter;
		}
		expect(seen.size).toBe(2048);
	});

	test("many calls in one millisecond without a seed never repeat", async () => {
		clock(T);
		const { entropy } = await fresh();
		const seen = new Set();
		for (let i = 0; i < 2048; i++) seen.add(toHex(entropy()));
		expect(seen.size).toBe(2048);
	});

	test("mixing seeds in one millisecond still never repeats", async () => {
		clock(T);
		const { entropy } = await fresh();
		const seen = new Set();
		for (let i = 0; i < 2048; i++) seen.add(toHex(entropy({ seed: i % 2 ? "a" : null })));
		expect(seen.size).toBe(2048);
	});

	test("the counter starts each tick at a random value in 0-2047 and resets when the tick advances", async () => {
		const spy = clock(T);
		const { entropy } = await fresh();
		const first = fields(entropy()).counter;
		expect(first).toBeGreaterThanOrEqual(0);
		expect(first).toBeLessThan(2048);
		expect(fields(entropy()).counter).toBe(first + 1);

		const starts = new Set();
		for (let i = 1; i <= 64; i++) {
			spy.mockReturnValue(T + i);
			const e = entropy();
			expect(e.timestamp).toBe(T + i);
			const { counter } = fields(e);
			expect(counter).toBeLessThan(2048);
			starts.add(counter);
		}
		// 64 random starts out of 2048 values are not all the same
		expect(starts.size).toBeGreaterThan(1);
	});
});

describe("seed", () => {
	beforeEach(() => clock(T));

	test("the seeded part is stable for a seed, across calls, ticks and fresh processes", async () => {
		const a = (await fresh()).entropy({ seed: "quack" });
		vi.mocked(Date.now).mockReturnValue(T + 5000);
		const b = (await fresh()).entropy({ seed: "quack" });
		expect(fields(a).seed).toBe(expectedSeedBits("quack"));
		expect(fields(b).seed).toBe(fields(a).seed);
		// the random part differs
		expect(toHex(a)).not.toBe(toHex(b));
	});

	test("different seeds give different seed bits", async () => {
		const { entropy } = await fresh();
		expect(expectedSeedBits("alpha")).not.toBe(expectedSeedBits("beta"));
		expect(fields(entropy({ seed: "alpha" })).seed).toBe(expectedSeedBits("alpha"));
		expect(fields(entropy({ seed: "beta" })).seed).toBe(expectedSeedBits("beta"));
		// back to the first seed after the cache moved on
		expect(fields(entropy({ seed: "alpha" })).seed).toBe(expectedSeedBits("alpha"));
	});

	test("the empty string is a seed, not 'no seed'", async () => {
		const { entropy } = await fresh();
		const seeds = new Set();
		for (let i = 0; i < 8; i++) seeds.add(fields(entropy({ seed: "" })).seed);
		expect([...seeds]).toEqual([expectedSeedBits("")]);
	});

	test("a Uint8Array seed hashes its bytes, matching the same text as a string", async () => {
		const { entropy } = await fresh();
		const bytes = new TextEncoder().encode("rummage · main");
		expect(fields(entropy({ seed: bytes })).seed).toBe(expectedSeedBits("rummage · main"));
	});

	test("without a seed the seed bits are random", async () => {
		const { entropy } = await fresh();
		const seeds = new Set();
		for (let i = 0; i < 64; i++) seeds.add(fields(entropy()).seed);
		expect(seeds.size).toBeGreaterThan(32);
	});

	test("null and undefined both mean no seed", async () => {
		const { entropy } = await fresh();
		const seeds = new Set();
		for (let i = 0; i < 32; i++) {
			seeds.add(fields(entropy({ seed: null })).seed);
			seeds.add(fields(entropy({ seed: undefined })).seed);
		}
		expect(seeds.size).toBeGreaterThan(32);
	});

	test("the random field varies with a fixed seed", async () => {
		const { entropy } = await fresh();
		const randoms = new Set();
		for (let i = 0; i < 64; i++) randoms.add(fields(entropy({ seed: "s" })).random);
		expect(randoms.size).toBeGreaterThan(32);
	});
});

describe("counter overflow", () => {
	test('"wait" spins until the clock reaches the next tick and never repeats', async () => {
		// Long enough on T for the counter (at most 4096 values) to run out, then T + 1.
		const reads = [];
		let n = 0;
		vi.spyOn(Date, "now").mockImplementation(() => {
			const value = ++n > 6000 ? T + 1 : T;
			reads.push(value);
			return value;
		});
		const { entropy } = await fresh();
		const ids = new Set();
		const ticks = [];
		for (let i = 0; i < 4200; i++) {
			const e = entropy({ seed: "burst" });
			ticks.push(e.timestamp);
			ids.add(UUID.TB(e.timestamp, e).toString());
		}
		expect(ids.size).toBe(4200);
		const firstOnNext = ticks.indexOf(T + 1);
		// between 2049 and 4096 values fit on T
		expect(firstOnNext).toBeGreaterThanOrEqual(2048);
		expect(firstOnNext).toBeLessThanOrEqual(4096);
		expect(ticks.slice(firstOnNext).every((t) => t === T + 1)).toBe(true);
		// it waited: the clock was read past the calls made, until it moved
		expect(reads.length).toBeGreaterThan(6000);
	});

	test('"advance" moves to the next tick without waiting and never repeats', async () => {
		const spy = clock(T);
		const { entropy } = await fresh();
		const ids = new Set();
		const ticks = new Set();
		for (let i = 0; i < 9000; i++) {
			const e = entropy({ seed: "burst", onOverflow: "advance" });
			ticks.add(e.timestamp);
			ids.add(UUID.TB(e.timestamp, e).toString());
		}
		expect(ids.size).toBe(9000);
		expect(Math.min(...ticks)).toBe(T);
		expect(Math.max(...ticks)).toBeGreaterThan(T + 1);
		// one clock read per call: no spinning
		expect(spy).toHaveBeenCalledTimes(9000);
	});

	test('"wait" with the clock behind the helper\'s tick advances instead of spinning', async () => {
		const spy = clock(T + 100);
		const { entropy } = await fresh();
		entropy();
		spy.mockReturnValue(T); // the clock went back
		const ids = new Set();
		const ticks = new Set();
		for (let i = 0; i < 4200; i++) {
			const e = entropy();
			ticks.add(e.timestamp);
			ids.add(`${e.timestamp}:${toHex(e)}`);
		}
		expect(ids.size).toBe(4200);
		expect([...ticks]).toEqual([T + 100, T + 101]);
		expect(spy).toHaveBeenCalledTimes(4201);
	});
});

describe("clock going backwards", () => {
	test("stays on the last tick and keeps counting", async () => {
		const spy = clock(T + 10);
		const { entropy } = await fresh();
		const a = entropy();
		spy.mockReturnValue(T);
		const b = entropy();
		expect(b.timestamp).toBe(T + 10);
		expect(fields(b).counter).toBe(fields(a).counter + 1);
	});
});

describe("precision", () => {
	test('"s" counts seconds, for TA', async () => {
		clock(T);
		const { entropy } = await fresh();
		const e = entropy({ precision: "s" });
		expect(e.timestamp).toBe(Math.floor(T / 1000));
		const id = UUID.TA(e.timestamp, e);
		expect(id.version()).toBe("TA");
		expect(id.getTimestamp()).toBe(Math.floor(T / 1000));
	});

	test('"s" and "ms" keep separate counters', async () => {
		const spy = clock(T);
		const { entropy } = await fresh();
		const s1 = fields(entropy({ precision: "s" })).counter;
		const ms1 = fields(entropy()).counter;
		// a new millisecond inside the same second: the ms counter resets, the s counter goes on
		spy.mockReturnValue(T + 1);
		const s2 = entropy({ precision: "s" });
		expect(fields(s2).counter).toBe(s1 + 1);
		expect(s2.timestamp).toBe(Math.floor(T / 1000));
		expect(entropy().timestamp).toBe(T + 1);
		expect(ms1).toBeLessThan(2048);
	});
});

describe("round-trip through TA/TB", () => {
	beforeEach(() => clock(T));

	test("TB keeps every entropy bit and the stamped tick", async () => {
		const { entropy } = await fresh();
		for (let i = 0; i < 64; i++) {
			const e = entropy({ seed: "round-trip" });
			const id = UUID.TB(e.timestamp, e);
			const bytes = id.toBuffer();
			expect(bytes[9] & 1).toBe(e[9]);
			expect(Array.from(bytes.subarray(10))).toEqual(Array.from(e.subarray(10)));
			expect(id.version()).toBe("TB");
			expect(id.getTimestamp()).toBe(T);
			// and the fields read back out of the id
			expect(fields(bytes)).toEqual(fields(e));
		}
	});

	test("the documented short form UUID.TB(undefined, entropy) works", () => {
		const e = UUID.entropy({ seed: "rummage · main" });
		const id = UUID.TB(undefined, e);
		expect(id.getTimestamp()).toBe(T);
		expect(fields(id.toBuffer()).seed).toBe(expectedSeedBits("rummage · main"));
	});

	test("ids from one process in one millisecond sort in the order they were made", async () => {
		const { entropy } = await fresh();
		const ids = [];
		for (let i = 0; i < 500; i++) {
			const e = entropy({ seed: "order" });
			ids.push(UUID.TB(e.timestamp, e).toString());
		}
		expect([...ids].sort()).toEqual(ids);
	});
});

describe("argument validation", () => {
	test("rejects bad options", async () => {
		const { entropy } = await fresh();
		expect(() => entropy(null)).toThrow(TypeError);
		expect(() => entropy("seed")).toThrow(TypeError);
		expect(() => entropy({ seed: 42 })).toThrow(TypeError);
		expect(() => entropy({ precision: "us" })).toThrow(RangeError);
		expect(() => entropy({ onOverflow: "throw" })).toThrow(RangeError);
	});
});
