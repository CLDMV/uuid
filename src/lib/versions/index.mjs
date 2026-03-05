/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /src/lib/versions/index.mjs
 *	@Date: 2025-12-30T17:00:08-08:00 (1767142808)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-03-04 21:03:44 -08:00 (1772687024)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

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
