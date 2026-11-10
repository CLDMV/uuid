/**
 * Build the `entropy` argument for `UUID.TA()` / `UUID.TB()`.
 *
 * Two calls in one module instance on the same tick never return the same bytes, with or
 * without a seed, at any `bits` of 12 or more (under 12 the counter is cut and repeats). Always stamp the id with the returned `.timestamp`: `UUID.TB(e.timestamp, e)`.
 * Letting TB read the clock itself (`UUID.TB(undefined, e)`) gives up the no-repeat guarantee
 * whenever the helper's tick differs from the clock: on overflow, with "advance", or after the
 * clock steps back.
 *
 * @param {EntropyOptions} [options] - Seed, precision and overflow handling
 * @returns {EntropyBytes} 16-byte array (bits 79-127 filled by default, the rest zero; with `bits`, the last `bits` bits, and longer than 16 bytes past 128 bits) with the tick used as `.timestamp`
 * @example
 * const e = entropy({ seed: "rummage · main" });
 * const id = UUID.TB(e.timestamp, e);
 * @example
 * // 64 bits of seeded entropy, in the last 8 bytes of a 16-byte array
 * const e = entropy({ seed: "rummage · main", bits: 64 });
 * @example
 * // TA stores seconds: use precision "s" (the default "ms" would stamp TA with milliseconds)
 * const e = entropy({ seed: "rummage · main", precision: "s" });
 * const id = UUID.TA(e.timestamp, e);
 */
export function entropy(options?: EntropyOptions): EntropyBytes;
/** Width of the counter field in bits. */
export const COUNTER_BITS: 12;
/** Width of the seed field in bits. */
export const SEED_BITS: 16;
/** Width of the random field in bits. */
export const RANDOM_BITS: 21;
/** Default length in bits: the 49 entropy bits TA and TB keep (bits 79-127), counter + seed + random. */
export const DEFAULT_BITS: 49;
/**
 * Entropy bytes: a 16-byte array (longer for `bits` past 128) plus the tick the counter was taken on.
 */
export type EntropyBytes = Uint8Array & {
    timestamp: number;
};
/**
 * Options for {@link entropy}.
 */
export type EntropyOptions = {
    /**
     * - Value whose SHA-1 fills the 16 seed bits; omitted or null fills them with random bits
     */
    seed?: string | Uint8Array<ArrayBufferLike> | null | undefined;
    /**
     * - Tick length for the counter: "ms" for TB (default), "s" for TA
     */
    precision?: "ms" | "s" | undefined;
    /**
     * - How many bits of entropy to fill, counted in bits (default 49, what TA/TB keep). The entropy fills the last `bits` bits of the array, which is 16 bytes, or `Math.ceil(bits / 8)` bytes for more than 128 bits. Fields are filled in order (12-bit counter, 16-bit seed fingerprint, random bits) and cut where the length runs out: under 28 bits the fingerprint keeps only its top bits, under 12 the counter keeps only its low bits
     */
    bits?: number | undefined;
    /**
     * - When the counter runs out inside a tick: "wait" spins until the clock reaches the next tick (default for "ms"; it advances instead if the clock steps back or stays frozen for 1,000,000 readings), "advance" moves to the next tick without waiting (default for "s")
     */
    onOverflow?: "wait" | "advance" | undefined;
};
//# sourceMappingURL=entropy.d.mts.map