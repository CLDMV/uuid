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
export function entropy(options?: EntropyOptions): EntropyBytes;
/** Width of the counter field in bits. */
export const COUNTER_BITS: 12;
/** Width of the seed field in bits. */
export const SEED_BITS: 16;
/** Width of the random field in bits. */
export const RANDOM_BITS: 21;
/**
 * Entropy bytes for TA / TB: a 16-byte array plus the tick the counter was taken on.
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
     * - When the counter runs out inside a tick: "wait" spins until the clock reaches the next tick (default), "advance" moves to the next tick without waiting
     */
    onOverflow?: "wait" | "advance" | undefined;
};
//# sourceMappingURL=entropy.d.mts.map