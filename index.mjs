/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /index.mjs
 *	@Date: 2025-12-15T16:18:10-08:00 (1765844290)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T15:33:29-07:00 (1790980409)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

// Development environment check. devcheck.mjs exists only in a source checkout; it is
// never published, so the import is allowed to fail. It runs inside an async function
// rather than as a top-level await: index.cjs loads this file through Node's synchronous
// require(esm), which rejects any module graph containing top-level await
// (ERR_REQUIRE_ASYNC_MODULE).
(async () => {
	try {
		await import("./devcheck.mjs");
	} catch {
		// ignore - devcheck.mjs is not published
	}
})();

/**
 * ESM entry point for UUID
 *
 * Re-exports all components from the main UUID module
 */
import { UUID, ISSUER_CATEGORIES } from "@cldmv/uuid/main";

export { UUID, UUID as uuid, ISSUER_CATEGORIES };
export default UUID;
