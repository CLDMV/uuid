/**
 * Turn a timestamp input into an exact bigint in the stored unit, and check the format can hold it.
 *
 * - `bigint`: taken as is.
 * - `number`: must be finite. A fractional value is floored (toward -Infinity), so
 *   `UUID.TA(Date.now() / 1000)` stores the second it falls in, before and after 1970 alike.
 * - `string`: a decimal integer such as `"-590295810358705651711"` (the exact form that survives JSON).
 * - `Date`: its milliseconds, or the floor of its seconds when `precision` is `"s"`.
 *   A `Date` only spans about ±275,760 years; pass a number, bigint or string for times past that.
 *
 * @param {number|bigint|string|Date} value - Timestamp input
 * @param {"s"|"ms"} [precision] - Unit to convert a Date to: "s" for versions 1 and 3, "ms" (default) for 2 and 4
 * @returns {bigint} Timestamp in the stored unit
 * @throws {RangeError} When the value isn't a whole number the format holds, or a Date is invalid
 * @throws {TypeError} When the value is not a number, bigint, string or Date
 */
export function toTimestampBigInt(value: number | bigint | string | Date, precision?: "s" | "ms"): bigint;
/**
 * Return a decoded timestamp as a number when that is exact, otherwise as a bigint.
 * @param {bigint} value - Decoded timestamp
 * @returns {number|bigint} A number for safe integers, the bigint past ±(2^53 - 1)
 */
export function toTimestampNumber(value: bigint): number | bigint;
/**
 * Write the 69-bit stored magnitude (already in negative-ordering form) into bits 1-63 and 69-74.
 * @param {Uint8Array} buffer - UUID buffer
 * @param {bigint} storedMagnitude - Stored 69-bit magnitude
 * @param {TimestampLayout} layout - Bit layout of the version being written
 */
export function writeStoredMagnitude(buffer: Uint8Array, storedMagnitude: bigint, layout: TimestampLayout): void;
/**
 * Read the 69-bit stored magnitude (negative-ordering form) from bits 1-63 and 69-74.
 * @param {Uint8Array} buffer - UUID buffer
 * @param {TimestampLayout} layout - Bit layout of the version being read
 * @returns {bigint} Stored 69-bit magnitude
 */
export function readStoredMagnitude(buffer: Uint8Array, layout: TimestampLayout): bigint;
/**
 * Write a timestamp (sign bit + 69-bit magnitude) into a UUID buffer.
 * @param {Uint8Array} buffer - UUID buffer
 * @param {bigint} value - Timestamp in the stored unit, from {@link toTimestampBigInt}
 * @param {TimestampLayout} layout - Bit layout of the version being written
 */
export function writeTimestamp(buffer: Uint8Array, value: bigint, layout: TimestampLayout): void;
/**
 * Read the timestamp (sign bit + 69-bit magnitude) from a UUID buffer, exactly.
 * @param {Uint8Array} buffer - UUID buffer
 * @param {TimestampLayout} layout - Bit layout of the version being read
 * @returns {bigint} Timestamp in the stored unit
 */
export function readTimestamp(buffer: Uint8Array, layout: TimestampLayout): bigint;
/**
 * Magnitude layout of a timestamp version.
 * @typedef {"legacy"|"ordered"|"full"} TimestampLayout
 */
/** Largest magnitude the 69-bit field holds: 2^69 - 1. */
export const TIMESTAMP_MAX_MAGNITUDE: bigint;
/**
 * Magnitude layout of a timestamp version.
 */
export type TimestampLayout = "legacy" | "ordered" | "full";
//# sourceMappingURL=timestamp.d.mts.map