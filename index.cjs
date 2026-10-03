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
"use strict";

// index.cjs is a thin wrapper: it loads index.mjs through Node's synchronous require(esm).
// Node.js versions without require(esm) would fail with a bare ERR_REQUIRE_ESM, so fail
// early with a message that says what to do instead.
if (!process.features?.require_module) {
	const error = new Error(
		`@cldmv/uuid: require() needs Node.js ^20.19.0 or >=22.12.0 (this is ${process.version}). On older Node.js, load the package with import() instead.`
	);
	error.code = "ERR_REQUIRE_ESM";
	throw error;
}

const { UUID, uuid, ISSUER_CATEGORIES } = require("./index.mjs");

// Export UUID as default
module.exports = UUID;
module.exports.UUID = UUID;
module.exports.uuid = uuid;
module.exports.ISSUER_CATEGORIES = ISSUER_CATEGORIES;
