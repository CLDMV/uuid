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
     * - When the counter runs out inside a tick: "wait" spins until the clock reaches the next tick (default for "ms"), "advance" moves to the next tick without waiting (default for "s")
     */
    onOverflow?: "wait" | "advance" | undefined;
};
//# sourceMappingURL=entropy.d.mts.map