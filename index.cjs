/**
 *	@Project: @cldmv/uuid
 *	@Filename: /index.cjs
 *	@Date: 2025-12-15 16:18:10 -08:00 (1765844290)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-12-15 17:12:17 -08:00 (1765847537)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
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
