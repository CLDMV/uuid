/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /src/lib/versions/timestamp/index.mjs
 *	@Date: 2025-12-30T17:00:08-08:00 (1767142808)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-02T21:25:22-08:00 (1793683522)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * Timestamp Variant UUID Versions
 *
 * Re-exports all timestamp variant implementations
 */

// v1/v2 (legacy layout) and v3/v4 (ordered layout) stay for ids already minted; TA and TB mint v5 and v6 (full layout)
export { v1, parseTimestamp as parseTimestampV1 } from "./v1.mjs";
export { v2, parseTimestamp as parseTimestampV2 } from "./v2.mjs";
export { v3, parseTimestamp as parseTimestampV3 } from "./v3.mjs";
export { v4, parseTimestamp as parseTimestampV4 } from "./v4.mjs";
export { v5, ta, parseTimestamp as parseTimestampV5 } from "./v5.mjs";
export { v6, tb, parseTimestamp as parseTimestampV6 } from "./v6.mjs";
