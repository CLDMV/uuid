/**
 * Custom UUID Variants - Re-exports
 *
 * Consolidates custom UUID variant implementations (TA, TB, IA) for easy import.
 *
 * Variant Structure:
 * - TA: Timestamp Variant v1 (seconds precision)
 * - TB: Timestamp Variant v2 (milliseconds precision)
 * - IA: Issuer Variant v1 (10-bit issuer ID)
 */

// Timestamp Variants
export { v1 as timestampV1, ta, parseTimestampV1 } from "./timestamp/index.mjs";
export { v2 as timestampV2, tb, parseTimestampV2 } from "./timestamp/index.mjs";

// Issuer Variant
export { v1 as issuerV1, ia, parseIssuerID, validateIssuerID, getIssuerCategory } from "./issuer/index.mjs";
