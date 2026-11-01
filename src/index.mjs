/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /src/index.mjs
 *	@Date: 2025-12-15T16:18:10-08:00 (1765844290)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T12:13:41-08:00 (1793564021)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * ESM entry point for @cldmv/uuid.
 *
 * Re-exports the UUID class (also as the default export and as `uuid`) and the issuer
 * categories from ./uuid.mjs. tsup bundles this file into dist/index.mjs.
 *
 * @module @cldmv/uuid
 */
import { UUID, ISSUER_CATEGORIES } from "./uuid.mjs";

export { UUID as default, UUID, UUID as uuid, ISSUER_CATEGORIES };
