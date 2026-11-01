/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /.configs/vitest.ci.config.mjs
 *	@Date: 2026-02-25T17:34:15-08:00 (1772069655)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T09:26:19-08:00 (1793553979)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
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
			// Real source only. index.mjs IS exercised (rfc-uuids.test.vitest.mjs imports
			// ../index.mjs), so it's measured. index.cjs (the CJS entry wrapper) is
			// deliberately omitted — no require()-based test currently exercises it.
			include: ["src/**", "index.mjs"],
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
