/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /tools/lib/header-config.mjs
 *	@Date: 2026-03-04 20:50:54 -08:00 (1772686254)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-03-04 21:03:46 -08:00 (1772687026)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Shared configuration for file header validation and fixing
 * Used by both analyze-errors.mjs and fix-headers.mjs
 */

/**
 * Configuration for file header check folders
 * @type {Array<{path: string, recursive: boolean}>}
 */
export const FILE_HEADER_CHECK_FOLDERS = [
	{ path: ".configs", recursive: true }, // .configs/ folder (recursive)
	{ path: ".github", recursive: true }, // .github/ folder (recursive)
	{ path: ".", recursive: false }, // Root folder only (non-recursive)
	{ path: "src", recursive: true }, // src/ folder (recursive)
	{ path: "tests", recursive: true }, // tests/ folder (recursive)
	{ path: "tools", recursive: true } // tools/ folder (recursive)
];

/**
 * Folders/files to ignore when checking file headers
 * @type {string[]}
 */
export const FILE_HEADER_IGNORE_FOLDERS = [
	"coverage", // Ignore coverage reports
	"tmp", // Ignore temporary files
	"node_modules", // Ignore node_modules
	"tools/fix-headers.mjs" // Ignore fix-headers.mjs (self-exclusion)
];
