/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /tsup.config.mjs
 *	@Date: 2026-11-01T12:09:07-08:00 (1793563747)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T12:13:47-08:00 (1793564027)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * @fileoverview Bundler config — produces the published dist/ output from src/.
 *
 *  - dist/index.mjs — the ESM entry, src/index.mjs bundled with everything it imports.
 *  - dist/index.cjs — not built: src/index.cjs is a thin wrapper that require()s the sibling
 *    index.mjs and maps it to the historical CommonJS shape. onSuccess copies it verbatim, so
 *    it never passes through esbuild and never duplicates the library.
 *  - dist/main.mjs — the deprecated "./main" alias (src/main.mjs). ./index.mjs is external, so
 *    it imports dist/index.mjs instead of carrying a second copy of the bundle.
 *  - dist/lib/{rng,bytes,hash}{,-browser}.mjs — the "./rng", "./bytes" and "./hash" subpaths.
 *
 * The library reaches rng/bytes/hash through those subpaths (`@cldmv/uuid/rng`, …), and they
 * stay external, so the consumer's resolver (or bundler) still picks the "browser" variant
 * through the exports map instead of the Node one being baked into dist/index.mjs.
 *
 * Output is minified with names kept; sourcemaps are generated for local debugging and
 * excluded from the tarball via package.json "files".
 */
import { copyFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "tsup";

const shared = {
	format: ["esm"],
	outDir: "dist",
	target: "node20",
	platform: "node",
	splitting: false,
	sourcemap: true,
	dts: false,
	minify: true,
	// Keep function and class names through minification (UUID.name, stack traces).
	keepNames: true,
	// Keep `node:` specifiers on built-in imports (tsup strips them by default).
	removeNodeProtocol: false,
	// The builds run in parallel into the same folder, so none of them cleans it; the `build`
	// script clears dist/ before invoking tsup instead.
	clean: false,
	// The package's own subpaths resolve through the exports map at runtime.
	external: [/^@cldmv\/uuid\//],
	outExtension() {
		return { js: ".mjs" };
	}
};

export default defineConfig([
	{
		...shared,
		entry: { index: "src/index.mjs" },
		// tsup calls this on the resolved options, so `this.outDir` is the directory the build
		// actually wrote to.
		onSuccess() {
			copyFileSync("src/index.cjs", join(this.outDir, "index.cjs"));
		}
	},
	{
		...shared,
		entry: { main: "src/main.mjs" },
		external: [...shared.external, "./index.mjs"]
	},
	{
		...shared,
		entry: {
			"lib/rng": "src/lib/rng.mjs",
			"lib/rng-browser": "src/lib/rng-browser.mjs",
			"lib/bytes": "src/lib/bytes.mjs",
			"lib/bytes-browser": "src/lib/bytes-browser.mjs",
			"lib/hash": "src/lib/hash.mjs",
			"lib/hash-browser": "src/lib/hash-browser.mjs"
		}
	}
]);
