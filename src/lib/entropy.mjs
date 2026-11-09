/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /src/lib/entropy.mjs
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
 * Entropy builder for the Timestamp Variant (TA / TB).
 *
 * `UUID.TA()` / `UUID.TB()` copy bytes 9-15 of their `entropy` argument and then overwrite
 * everything above bit 79 with the variant, subvariant, version and timestamp fields. What
 * survives is 49 bits: the lowest bit of byte 9 (bit 79) and all of bytes 10-15 (bits 80-127).
 * This module fills exactly those 49 bits, most significant first:
 *
 * | UUID bits | Width | Field                                                         |
 * |-----------|-------|---------------------------------------------------------------|
 * | 79-90     | 12    | Counter, per tick (millisecond or second) and per process     |
 * | 91-106    | 16    | Seed: first 16 bits of SHA-1(seed), or random without a seed  |
 * | 107-127   | 21    | Random                                                        |
 *
 * The counter starts each tick at a random value in 0-2047 and counts up to 4095, so a
 * process gets at least 2048 values per tick, and two processes rarely start on the same
 * value. Within one process, two calls on the same tick never return the same bytes: the
 * counter differs. Because the counter is the most significant field, ids minted from one
 * process in one tick also sort in the order they were made.
 *
 * The tick never moves backwards: if the clock goes back, the helper stays on the last tick
 * it used and keeps counting. When the counter runs out inside a tick, the helper either
 * spins until the clock reaches the next tick (`onOverflow: "wait"`, the default) or moves
 * to the next tick straight away (`onOverflow: "advance"`, also used by "wait" when the clock
 * is behind the helper's tick). Either way, the tick it used is on the result as
 * `.timestamp`, so the caller can stamp the id with it.
 *
 * Browser-safe: the only imports are the package's own `rng` and `hash` subpaths, which pick
 * Web Crypto and the pure-JS SHA-1 under the "browser" condition.
 */

import { randomBytes } from "@cldmv/uuid/rng";
import { sha1 } from "@cldmv/uuid/hash";

/** Width of the counter field in bits. */
export const COUNTER_BITS = 12;
/** Width of the seed field in bits. */
export const SEED_BITS = 16;
/** Width of the random field in bits. */
export const RANDOM_BITS = 21;

const COUNTER_MAX = 2 ** COUNTER_BITS - 1; // 4095
const COUNTER_START_RANGE = 2 ** (COUNTER_BITS - 1); // random start in 0-2047
const SEED_SHIFT = 2 ** RANDOM_BITS;
const COUNTER_SHIFT = 2 ** (SEED_BITS + RANDOM_BITS);
const EMPTY = new Uint8Array(0);

/**
 * Per-precision clock state: the last tick handed out and the next counter value on it.
 * @type {Record<"ms" | "s", { tick: number, counter: number }>}
 */
const state = {
	ms: { tick: -Infinity, counter: 0 },
	s: { tick: -Infinity, counter: 0 }
};

/** Last seed hashed and its 16 seed bits, so repeated calls with one seed hash it once. */
let cachedSeed = null;
let cachedSeedBits = 0;

/**
 * Entropy bytes for TA / TB: a 16-byte array plus the tick the counter was taken on.
 * @typedef {Uint8Array & { timestamp: number }} EntropyBytes
 */

/**
 * Options for {@link entropy}.
 * @typedef {object} EntropyOptions
 * @property {string|Uint8Array|null} [seed] - Value whose SHA-1 fills the 16 seed bits; omitted or null fills them with random bits
 * @property {"ms"|"s"} [precision] - Tick length for the counter: "ms" for TB (default), "s" for TA
 * @property {"wait"|"advance"} [onOverflow] - When the counter runs out inside a tick: "wait" spins until the clock reaches the next tick (default), "advance" moves to the next tick without waiting
 */

/**
 * Read the current tick from the clock.
 * @param {"ms"|"s"} precision - Tick length
 * @returns {number} Current tick
 */
function now(precision) {
	const ms = Date.now();
	return precision === "s" ? Math.floor(ms / 1000) : ms;
}

/**
 * Compute the 16 seed bits for a seed.
 * @param {string|Uint8Array} seed - Seed value
 * @returns {number} First 16 bits of SHA-1(seed)
 */
function seedBits(seed) {
	if (typeof seed === "string" && seed === cachedSeed) {
		return cachedSeedBits;
	}
	// A string is hashed as UTF-8; bytes are hashed as-is (passed as the hash's prefix bytes
	// with an empty name, which both the Node and the browser hash support).
	const digest = typeof seed === "string" ? sha1(EMPTY, seed) : sha1(seed, "");
	const bits = (digest[0] << 8) | digest[1];
	if (typeof seed === "string") {
		cachedSeed = seed;
		cachedSeedBits = bits;
	}
	return bits;
}

/**
 * Move a clock state onto a new tick with a fresh random counter start.
 * @param {{ tick: number, counter: number }} clock - Clock state to reset
 * @param {number} tick - New tick
 */
function startTick(clock, tick) {
	const r = randomBytes(2);
	clock.tick = tick;
	clock.counter = ((r[0] << 8) | r[1]) % COUNTER_START_RANGE;
}

/**
 * Take the next (tick, counter) pair from a clock, handling overflow.
 * @param {"ms"|"s"} precision - Tick length
 * @param {"wait"|"advance"} onOverflow - Overflow handling
 * @returns {{ tick: number, counter: number }} Tick and counter value to use
 */
function nextSlot(precision, onOverflow) {
	const clock = state[precision];
	const current = now(precision);
	if (current > clock.tick) {
		startTick(clock, current);
	} else if (clock.counter > COUNTER_MAX) {
		// Out of counter values on this tick.
		if (onOverflow === "wait" && current === clock.tick) {
			let next = current;
			while (next <= clock.tick) {
				next = now(precision);
			}
			startTick(clock, next);
		} else {
			// "advance", or the clock is behind the helper's tick (it went backwards), where
			// waiting could take as long as the jump was.
			startTick(clock, clock.tick + 1);
		}
	}
	return { tick: clock.tick, counter: clock.counter++ };
}

/**
 * Build the `entropy` argument for `UUID.TA()` / `UUID.TB()`.
 *
 * Two calls in one process on the same tick never return the same bytes, with or without a
 * seed. Stamp the id with the returned `.timestamp` to keep that guarantee across a tick
 * boundary: `UUID.TB(e.timestamp, e)`. `UUID.TB(undefined, e)` reads the clock again, which
 * almost always gives the same tick.
 *
 * @param {EntropyOptions} [options] - Seed, precision and overflow handling
 * @returns {EntropyBytes} 16-byte array (bits 79-127 filled, the rest zero) with the tick used as `.timestamp`
 * @example
 * const e = entropy({ seed: "rummage · main" });
 * const id = UUID.TB(e.timestamp, e);
 * @example
 * // TA counts seconds
 * const e = entropy({ precision: "s" });
 * const id = UUID.TA(e.timestamp, e);
 */
export function entropy(options = {}) {
	if (options === null || typeof options !== "object") {
		throw new TypeError("entropy() options must be an object");
	}
	const { seed = null, precision = "ms", onOverflow = "wait" } = options;
	if (seed !== null && typeof seed !== "string" && !(seed instanceof Uint8Array)) {
		throw new TypeError("entropy() seed must be a string or a Uint8Array");
	}
	if (precision !== "ms" && precision !== "s") {
		throw new RangeError(`entropy() precision must be "ms" or "s", got ${JSON.stringify(precision)}`);
	}
	if (onOverflow !== "wait" && onOverflow !== "advance") {
		throw new RangeError(`entropy() onOverflow must be "wait" or "advance", got ${JSON.stringify(onOverflow)}`);
	}

	const { tick, counter } = nextSlot(precision, onOverflow);

	const r = randomBytes(5);
	const random = ((r[0] << 16) | (r[1] << 8) | r[2]) & (SEED_SHIFT - 1);
	const seedField = seed === null ? (r[3] << 8) | r[4] : seedBits(seed);

	// 49-bit value: counter | seed | random. Below 2^49, so plain Number arithmetic is exact.
	let value = counter * COUNTER_SHIFT + seedField * SEED_SHIFT + random;

	const out = /** @type {EntropyBytes} */ (new Uint8Array(16));
	for (let i = 15; i >= 10; i--) {
		out[i] = value % 256;
		value = Math.floor(value / 256);
	}
	out[9] = value; // the 49th bit, at bit 79 (the lowest bit of byte 9)
	out.timestamp = tick;
	return out;
}
