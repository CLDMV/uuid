/**
 *	@Project: @cldmv/uuid
 *	@Filename: /src/lib/versions/rfc/index.mjs
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
 * RFC 4122/9562 UUID Versions - Re-exports
 *
 * Consolidates all RFC UUID versions and utilities for easy import.
 */

// Utility functions
export { parse, stringify, validate, version } from "./utils.mjs";

// UUID version generators
export { v1 } from "./v1.mjs";
export { v3, v5 } from "./v35.mjs";
export { v4 } from "./v4.mjs";
export { v6 } from "./v6.mjs";
export { v7 } from "./v7.mjs";
export { v8 } from "./v8.mjs";

// Constants (re-exported from constants.mjs)
export { NIL, MAX, DNS, URL, OID, X500 } from "../../constants.mjs";
