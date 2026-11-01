/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /src/main.mjs
 *	@Date: 2026-11-01T12:08:47-08:00 (1793563727)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T12:13:44-08:00 (1793564024)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * Deprecated alias for the package root, kept for "@cldmv/uuid/main" until the next major
 * version. It re-exports ./index.mjs, so every value is the same object the root exports.
 * ES modules are evaluated once per process, so the warning prints once however many times
 * the alias is imported; `node --no-deprecation` silences it and the code lets consumers
 * filter it.
 *
 * tsup builds this as its own entry with ./index.mjs external, so dist/main.mjs imports
 * dist/index.mjs instead of carrying a second copy of the library.
 *
 * @module @cldmv/uuid/main
 * @deprecated Import "@cldmv/uuid" instead.
 */

const message = '"@cldmv/uuid/main" is deprecated; import "@cldmv/uuid" instead.';
if (typeof process !== "undefined" && typeof process.emitWarning === "function") {
	process.emitWarning(message, { type: "DeprecationWarning", code: "CLDMV_UUID_MAIN" });
} else {
	console.warn(`DeprecationWarning: ${message}`);
}

export * from "./index.mjs";
export { default } from "./index.mjs";
