/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /index.cjs
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

/**
 * CommonJS entry point for UUID
 *
 * This file provides CommonJS (require) support for the UUID library.
 * It imports and re-exports the main UUID functions from the ESM module.
 *
 * @module uuid
 */
const { createRequire } = require("module");
const requireESM = createRequire(__filename);

const { UUID, uuid, ISSUER_CATEGORIES } = requireESM("./index.mjs");

// Export UUID as default
module.exports = UUID;
module.exports.UUID = UUID;
module.exports.uuid = uuid;
module.exports.ISSUER_CATEGORIES = ISSUER_CATEGORIES;
