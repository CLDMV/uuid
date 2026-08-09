/**
 *	@Project: @cldmv/uuid
 *	@Filename: /src/lib/versions/timestamp/index.mjs
 *	@Date: 2025-12-30T17:00:08-08:00 (1767142808)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Shinrai <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-08-08 17:13:20 -07:00 (1786234400)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Timestamp Variant UUID Versions
 *
 * Re-exports all timestamp variant implementations
 */

export { v1, ta, parseTimestamp as parseTimestampV1 } from "./v1.mjs";
export { v2, tb, parseTimestamp as parseTimestampV2 } from "./v2.mjs";
