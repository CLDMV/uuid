/**
 * The variant bits and family of a UUID. The RFC 9562 Nil (all zeros) and Max (all
 * ones) ids belong to the RFC family even though their variant bits read 000 and 111.
 * @param {Uint8Array} bytes - 16 UUID bytes
 * @returns {{ variant: number, family: "NCS"|"RFC 4122/9562"|"Microsoft"|"Custom", isCustom: boolean, special: "nil"|"max"|null }} Classification
 */
export function classify(bytes: Uint8Array): {
    variant: number;
    family: "NCS" | "RFC 4122/9562" | "Microsoft" | "Custom";
    isCustom: boolean;
    special: "nil" | "max" | null;
};
/**
 * Read the timestamp of an RFC version 1, 6 or 7 UUID on the Unix epoch.
 * @param {Uint8Array} bytes - 16 UUID bytes
 * @param {number} version - RFC version (bits 48-51)
 * @returns {{ value: bigint, unit: "ms"|"100ns" }|null} Timestamp, or null for versions without one
 */
export function readRfcTimestamp(bytes: Uint8Array, version: number): {
    value: bigint;
    unit: "ms" | "100ns";
} | null;
/**
 * Convert a timestamp to 100-ns ticks, the common scale used to order ids by time.
 * @param {bigint} value - Timestamp in `unit`
 * @param {"s"|"ms"|"100ns"} unit - Unit of `value`
 * @returns {bigint} 100-ns ticks since the Unix epoch
 */
export function toTicks(value: bigint, unit: "s" | "ms" | "100ns"): bigint;
/**
 * ISO 8601 date of a timestamp, or null when it falls outside what a Date can hold.
 * @param {bigint} value - Timestamp in `unit`
 * @param {"s"|"ms"|"100ns"} unit - Unit of `value`
 * @returns {string|null} ISO date string (millisecond precision)
 */
export function toISODate(value: bigint, unit: "s" | "ms" | "100ns"): string | null;
/**
 * Describe any UUID with the same fields.
 * @param {Uint8Array} bytes - 16 UUID bytes
 * @returns {{
 *   isUUID: boolean,
 *   variant: number,
 *   variantFamily: "NCS"|"RFC 4122/9562"|"Microsoft"|"Custom",
 *   subvariant: number|null,
 *   version: number|null,
 *   variantIdentifier: string|number|null,
 *   issuerID: number|null,
 *   issuerCategory: string|null,
 *   timestamp: bigint|null,
 *   timestampUnit: "s"|"ms"|"100ns"|null,
 *   date: string|null,
 *   isIssuerVariant: boolean,
 *   isTimestampVariant: boolean
 * }} Description; `timestamp` is a bigint here, callers convert it
 */
export function describeBytes(bytes: Uint8Array): {
    isUUID: boolean;
    variant: number;
    variantFamily: "NCS" | "RFC 4122/9562" | "Microsoft" | "Custom";
    subvariant: number | null;
    version: number | null;
    variantIdentifier: string | number | null;
    issuerID: number | null;
    issuerCategory: string | null;
    timestamp: bigint | null;
    timestampUnit: "s" | "ms" | "100ns" | null;
    date: string | null;
    isIssuerVariant: boolean;
    isTimestampVariant: boolean;
};
export const RFC_FAMILY: "RFC 4122/9562";
//# sourceMappingURL=describe.d.mts.map