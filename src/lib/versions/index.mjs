/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /src/lib/versions/index.mjs
 *	@Date: 2025-12-30T17:00:08-08:00 (1767142808)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T15:33:32-07:00 (1790980412)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * Custom UUID Variants - Re-exports
 *
 * Consolidates custom UUID variant implementations (TA, TB, IA) for easy import.
 *
 * Variant Structure:
 * - TA: Timestamp Variant v5 (seconds precision, full layout); v1 and v3 are the older seconds layouts
 * - TB: Timestamp Variant v6 (milliseconds precision, full layout); v2 and v4 are the older milliseconds layouts
 * - IA: Issuer Variant v1 (10-bit issuer ID)
 */

// Timestamp Variants
export {
	v1 as timestampV1,
	v2 as timestampV2,
	v3 as timestampV3,
	v4 as timestampV4,
	v5 as timestampV5,
	v6 as timestampV6,
	ta,
	tb,
	parseTimestampV1,
	parseTimestampV2,
	parseTimestampV3,
	parseTimestampV4,
	parseTimestampV5,
	parseTimestampV6
} from "./timestamp/index.mjs";

// Issuer Variant
export { v1 as issuerV1, ia, parseIssuerID, validateIssuerID, getIssuerCategory } from "./issuer/index.mjs";
