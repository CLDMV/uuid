/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /src/lib/entropy.mjs
 *	@Date: 2026-11-09T04:29:21-08:00 (1794227361)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-09T05:05:23-08:00 (1794229523)
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
 * process gets at least 2048 values per tick. Within one module instance, two calls on the
 * same tick never get the same counter, so they never return the same bytes. The counter
 * lives in this module's state: each worker, thread or separately loaded copy of the module
 * has its own. Because the counter is the most significant field, ids minted from one
 * instance in one tick also sort in the order they were made.
 *
 * Across instances, uniqueness rests on chance: two with the same seed that each mint an id
 * on the same tick collide with probability about 2^-32 for that pair (2^-11 for the same
 * counter start, times 2^-21 for the random bits), and about 2^-48 with no seed.
 *
 * The tick never moves backwards: if the clock goes back, the helper stays on the last tick
 * it used and keeps counting. When the counter runs out inside a tick, the helper either
 * spins until the clock reaches the next tick (`onOverflow: "wait"`, the default for "ms") or
 * moves to the next tick straight away (`onOverflow: "advance"`, the default for "s"). "wait"
 * also advances instead of spinning when the clock is, or steps, behind the helper's tick,
 * and when the clock doesn't move for 1,000,000 readings in a row (a frozen `Date.now()`,
 * as under fake timers), so a wait always ends.
 * Either way, the tick used is on the result as `.timestamp`; stamp the id with it
 * (`UUID.TB(e.timestamp, e)`), since only then does the no-repeat guarantee hold for the id.
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
const EMPTY = new Uint8Array(0);
// Readings without progress after which an overflow "wait" gives up on the clock and advances
// the tick itself. A real clock moves within a few thousand readings; a frozen one (fake
// timers) never does.
const SPIN_LIMIT = 1_000_000;

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
 * @property {"wait"|"advance"} [onOverflow] - When the counter runs out inside a tick: "wait" spins until the clock reaches the next tick (default for "ms"; it advances instead if the clock steps back or stays frozen for 1,000,000 readings), "advance" moves to the next tick without waiting (default for "s")
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
	// The top 11 random bits, 0-2047.
	clock.counter = ((r[0] << 3) | (r[1] >> 5)) & (COUNTER_START_RANGE - 1);
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
		let next = clock.tick + 1;
		if (onOverflow === "wait" && current === clock.tick) {
			let reading = current;
			for (let spins = 0; reading === clock.tick && spins < SPIN_LIMIT; spins++) {
				reading = now(precision);
			}
			// A reading below the tick means the clock stepped back during the spin; waiting for
			// it to catch up could take as long as the step, so advance instead. A reading still on
			// the tick means the clock is frozen, so advance too.
			if (reading > clock.tick) next = reading;
		}
		// "advance", or the clock is behind the helper's tick (it went backwards), where waiting
		// could take as long as the jump was.
		startTick(clock, next);
	}
	return { tick: clock.tick, counter: clock.counter++ };
}

/**
 * Build the `entropy` argument for `UUID.TA()` / `UUID.TB()`.
 *
 * Two calls in one module instance on the same tick never return the same bytes, with or
 * without a seed. Always stamp the id with the returned `.timestamp`: `UUID.TB(e.timestamp, e)`.
 * Letting TB read the clock itself (`UUID.TB(undefined, e)`) gives up the no-repeat guarantee
 * whenever the helper's tick differs from the clock: on overflow, with "advance", or after the
 * clock steps back.
 *
 * @param {EntropyOptions} [options] - Seed, precision and overflow handling
 * @returns {EntropyBytes} 16-byte array (bits 79-127 filled, the rest zero) with the tick used as `.timestamp`
 * @example
 * const e = entropy({ seed: "rummage · main" });
 * const id = UUID.TB(e.timestamp, e);
 * @example
 * // TA stores seconds: use precision "s" (the default "ms" would stamp TA with milliseconds)
 * const e = entropy({ seed: "rummage · main", precision: "s" });
 * const id = UUID.TA(e.timestamp, e);
 */
export function entropy(options = {}) {
	if (options === null || typeof options !== "object") {
		throw new TypeError("entropy() options must be an object");
	}
	const { seed = null, precision = "ms" } = options;
	const { onOverflow = precision === "s" ? "advance" : "wait" } = options;
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

	// r[0] low 5 bits + r[1] + r[2]: the 21 random bits; r[3], r[4]: the seed bits without a seed.
	const r = randomBytes(5);
	const seedField = seed === null ? (r[3] << 8) | r[4] : seedBits(seed);

	// Pack counter (12) | seed (16) | random (21) into bit 79 and bytes 10-15, most
	// significant first, with masks and shifts only.
	const out = /** @type {EntropyBytes} */ (new Uint8Array(16));
	out[9] = (counter >> 11) & 0x01; // counter bit 11, at bit 79 (the lowest bit of byte 9)
	out[10] = (counter >> 3) & 0xff; // counter bits 10-3
	out[11] = ((counter & 0x07) << 5) | ((seedField >> 11) & 0x1f); // counter bits 2-0, seed bits 15-11
	out[12] = (seedField >> 3) & 0xff; // seed bits 10-3
	out[13] = ((seedField & 0x07) << 5) | (r[0] & 0x1f); // seed bits 2-0, random bits 20-16
	out[14] = r[1]; // random bits 15-8
	out[15] = r[2]; // random bits 7-0
	out.timestamp = tick;
	return out;
}
