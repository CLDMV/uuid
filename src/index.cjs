/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /src/index.cjs
 *	@Date: 2025-12-15T16:18:10-08:00 (1765844290)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T16:27:17-08:00 (1793579237)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * CommonJS entry point: a thin, synchronous wrapper around the sibling ESM entry.
 *
 * `require("@cldmv/uuid")` returns the module object, `{ __esModule, default: UUID, UUID, uuid, ISSUER_CATEGORIES }`,
 * because the ESM entry exports two distinct values (the UUID class and ISSUER_CATEGORIES). Destructure what you need:
 * `const { UUID } = require("@cldmv/uuid")`.
 *
 * tsup.config.mjs copies this file verbatim to dist/index.cjs, so it never passes through esbuild. Its
 * `require("./index.mjs")` resolves to src/index.mjs in a checkout and to the bundle in dist/.
 *
 * @module @cldmv/uuid
 */
"use strict";

if (!process.features?.require_module) {
	const error = new Error(
		`@cldmv/uuid: require() needs Node.js ^20.19.0 or >=22.13.0 (this is ${process.version}). On older Node.js, load the package with import() instead.`
	);
	error.code = "ERR_REQUIRE_ESM";
	throw error;
}

// Same exports as `import`. One distinct exported value (aliases of it count once) comes back as that value,
// so require(x)(...) works; anything else comes back as the module object ({ default, ...named }).
const esm = require("./index.mjs");
const values = new Set(
	Object.keys(esm)
		.filter((key) => key !== "__esModule")
		.map((key) => esm[key])
);
module.exports = values.size === 1 ? values.values().next().value : esm;
