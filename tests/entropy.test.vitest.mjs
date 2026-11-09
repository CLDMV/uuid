/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /tests/entropy.test.vitest.mjs
 *	@Date: 2026-11-09T04:30:43-08:00 (1794227443)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-09T04:45:36-08:00 (1794228336)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * UUID.entropy() — the TA/TB entropy builder (uuid#102).
 *
 * The helper keeps per-instance clock state, so every test loads a fresh copy of the package
 * entry (vi.resetModules + dynamic import of "@cldmv/uuid", so `npm run test:dist` covers the
 * build too) and pins Date.now().
 */

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { UUID } from "@cldmv/uuid";
import { sha1 } from "@cldmv/uuid/hash";
import { toHex } from "@cldmv/uuid/bytes";

const T = 1794247200123; // a fixed millisecond

/**
 * Load a fresh copy of the package (clean clock state) and return its entropy helper.
 * @returns {Promise<{ entropy: (options?: object) => Uint8Array & { timestamp: number } }>}
 */
async function fresh() {
	vi.resetModules();
	const { UUID: FreshUUID } = await import("@cldmv/uuid");
	return { entropy: (options) => FreshUUID.entropy(options) };
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

/**
 * Mint `count` entropies and check the invariants every result must hold: only bits 79-127
 * set, the counter within 12 bits, every (tick, counter) pair unique, the last counter on a
 * tick that overflowed is 4095, and the stamped ids on each tick sort in the order minted.
 * @param {(options?: object) => Uint8Array & { timestamp: number }} entropy - Helper under test
 * @param {number} count - How many to mint
 * @param {(i: number) => object} [optionsFor] - Options for the i-th call
 * @returns {{ results: Array<Uint8Array & { timestamp: number }>, ticks: number[] }}
 */
function mintChecked(entropy, count, optionsFor = () => ({})) {
	const results = [];
	const pairs = new Set();
	const byTick = new Map();
	for (let i = 0; i < count; i++) {
		const options = optionsFor(i);
		const e = entropy(options);
		expect(Array.from(e.subarray(0, 9))).toEqual(new Array(9).fill(0));
		expect(e[9] & 0xfe).toBe(0);
		const { counter } = fields(e);
		expect(counter).toBeLessThanOrEqual(4095);
		pairs.add(`${e.timestamp}:${counter}`);
		const id = options.precision === "s" ? UUID.TA(e.timestamp, e) : UUID.TB(e.timestamp, e);
		if (!byTick.has(e.timestamp)) byTick.set(e.timestamp, []);
		byTick.get(e.timestamp).push({ id: id.toString(), counter });
		results.push(e);
	}
	expect(pairs.size).toBe(count);
	const ticks = [...byTick.keys()];
	for (const [index, tick] of ticks.entries()) {
		const minted = byTick.get(tick);
		const ids = minted.map((m) => m.id);
		expect([...ids].sort()).toEqual(ids);
		// every tick but the last one was left because its counter ran out at 4095
		if (index < ticks.length - 1) expect(minted.at(-1).counter).toBe(4095);
	}
	return { results, ticks };
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

	test("UUID.entropy on the statically imported class works too", () => {
		const e = UUID.entropy({ seed: "x" });
		expect(e.length).toBe(16);
		expect(fields(e).seed).toBe(expectedSeedBits("x"));
	});
});

describe("uniqueness at millisecond precision", () => {
	test("many calls in one millisecond with one seed never repeat a counter", async () => {
		clock(T);
		const { entropy } = await fresh();
		const { results, ticks } = mintChecked(entropy, 2048, () => ({ seed: "rummage · main" }));
		expect(ticks).toEqual([T]);
		let previous = null;
		for (const e of results) {
			const { counter, seed } = fields(e);
			expect(seed).toBe(expectedSeedBits("rummage · main"));
			if (previous !== null) expect(counter).toBe(previous + 1);
			previous = counter;
		}
		expect(new Set(results.map((e) => toHex(e))).size).toBe(2048);
	});

	test("many calls in one millisecond without a seed never repeat a counter", async () => {
		clock(T);
		const { entropy } = await fresh();
		const { ticks } = mintChecked(entropy, 2048);
		expect(ticks).toEqual([T]);
	});

	test("mixing seeds in one millisecond still never repeats a counter", async () => {
		clock(T);
		const { entropy } = await fresh();
		const { ticks } = mintChecked(entropy, 2048, (i) => ({ seed: i % 2 ? "a" : null }));
		expect(ticks).toEqual([T]);
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

	test("the seeded part is stable for a seed, across calls, ticks and fresh instances", async () => {
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
	test('"wait" (the "ms" default) spins until the clock reaches the next tick', async () => {
		// Long enough on T for the counter (at most 4096 values) to run out, then T + 1.
		let reads = 0;
		vi.spyOn(Date, "now").mockImplementation(() => (++reads > 6000 ? T + 1 : T));
		const { entropy } = await fresh();
		// 4097 calls: at least one past what fits on T (at most 4096), and no more than fit on T + 1 (at least 2049 after a tick that held 2048)
		const { results, ticks } = mintChecked(entropy, 4097, () => ({ seed: "burst" }));
		expect(ticks).toEqual([T, T + 1]);
		const firstOnNext = results.findIndex((e) => e.timestamp === T + 1);
		// between 2048 and 4096 values fit on T
		expect(firstOnNext).toBeGreaterThanOrEqual(2048);
		expect(firstOnNext).toBeLessThanOrEqual(4096);
		// it waited: the clock was read past the calls made, until it moved
		expect(reads).toBeGreaterThan(6000);
	});

	test('"advance" moves to the next tick without waiting', async () => {
		const spy = clock(T);
		const { entropy } = await fresh();
		const { ticks } = mintChecked(entropy, 9000, () => ({ seed: "burst", onOverflow: "advance" }));
		expect(ticks[0]).toBe(T);
		expect(ticks.length).toBeGreaterThan(2);
		expect(ticks).toEqual(ticks.map((_, i) => T + i));
		// one clock read per call: no spinning
		expect(spy).toHaveBeenCalledTimes(9000);
	});

	test('"s" defaults to "advance": a frozen second never blocks', async () => {
		const spy = clock(T);
		const { entropy } = await fresh();
		const second = Math.floor(T / 1000);
		const { ticks } = mintChecked(entropy, 4097, () => ({ seed: "burst", precision: "s" }));
		expect(ticks).toEqual([second, second + 1]);
		expect(spy).toHaveBeenCalledTimes(4097);
	});

	test('"wait" with the clock behind the helper\'s tick advances instead of spinning', async () => {
		const spy = clock(T + 100);
		const { entropy } = await fresh();
		entropy();
		spy.mockReturnValue(T); // the clock went back
		const { ticks } = mintChecked(entropy, 4096);
		expect(ticks).toEqual([T + 100, T + 101]);
		expect(spy).toHaveBeenCalledTimes(4097);
	});

	test('"wait" stops spinning when the clock steps back during the wait', async () => {
		// T until the counter has run out and the spin has started, then the clock steps back
		// a minute and never reaches T + 1.
		let reads = 0;
		const spy = vi.spyOn(Date, "now").mockImplementation(() => (++reads > 5000 ? T - 60000 : T));
		const { entropy } = await fresh();
		const { ticks } = mintChecked(entropy, 4097);
		expect(ticks).toEqual([T, T + 1]);
		// the first read past the step back ended the spin: after it, one read per call
		expect(spy.mock.calls.length).toBeLessThan(4097 + 5000);
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
		entropy();
		// a new millisecond inside the same second: the ms tick moves, the s counter goes on
		spy.mockReturnValue(T + 1);
		const s2 = entropy({ precision: "s" });
		expect(fields(s2).counter).toBe(s1 + 1);
		expect(s2.timestamp).toBe(Math.floor(T / 1000));
		expect(entropy().timestamp).toBe(T + 1);
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
