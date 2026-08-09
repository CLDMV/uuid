/**
 *	@Project: @cldmv/uuid
 *	@Filename: /.configs/vitest.ci.config.mjs
 *	@Date: 2026-02-25 17:34:15 -08:00 (1772069655)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Shinrai <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-08-08 17:13:20 -07:00 (1786234400)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

import base from "./vitest.config.mjs";

export default {
	...base,

	// CI: pick a pool and force it to 1 worker.
	// Use forks for CI stability, but threads is fine too.
	// pool: "forks",
	maxForks: 1,
	minForks: 1,

	// Optional: if you choose pool: "threads" instead:
	// pool: "threads",
	maxThreads: 1,
	minThreads: 1,

	test: {
		...base.test,

		// CI: no file-level parallelism either (hard clamp)
		maxWorkers: 1,
		minWorkers: 1,
		fileParallelism: false,

		coverage: {
			enabled: true,
			provider: "v8",
			// Real source only. index.mjs and devcheck.mjs ARE exercised (rfc-uuids.test.vitest.mjs
			// imports ../index.mjs; uuid-coverage.test.vitest.mjs drives devcheck.mjs's CI/dev-env
			// branches directly), so they're measured. index.cjs (the CJS entry wrapper) is
			// deliberately omitted — no require()-based test currently exercises it.
			include: ["src/**", "index.mjs", "devcheck.mjs"],
			exclude: [
				"src/data/**", // static JSON data, no executable logic
				"scripts/**",
				"tools/**"
			],
			reporter: ["text", "html", "json-summary"],
			reportsDirectory: "coverage"
		}
	}
};
