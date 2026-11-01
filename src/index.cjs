/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /src/index.cjs
 *	@Date: 2025-12-15T16:18:10-08:00 (1765844290)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T13:18:04-08:00 (1793567884)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * CommonJS entry point — a thin, synchronous wrapper around the sibling ESM entry.
 *
 * Node's `require()` loads an ES module synchronously (require(esm)) as long as its module
 * graph has no top-level await, so this file re-exports ./index.mjs instead of the build
 * producing a second, CommonJS copy of the library. It maps the ESM namespace to the
 * historical CommonJS shape: the UUID class itself, with UUID, uuid and ISSUER_CATEGORIES
 * as properties.
 *
 * Node.js versions without require(esm) would fail with a bare ERR_REQUIRE_ESM, so the
 * check below fails early with a message that says what to do instead.
 *
 * tsup.config.mjs copies this file verbatim to dist/index.cjs, so it never passes through
 * esbuild. Its `require("./index.mjs")` resolves to src/index.mjs in a checkout and to the
 * bundle in dist/.
 *
 * @module @cldmv/uuid
 */
"use strict";

if (!process.features?.require_module) {
	const error = new Error(
		`@cldmv/uuid: require() needs Node.js >=22.22.0 (this is ${process.version}). On older Node.js, load the package with import() instead.`
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
