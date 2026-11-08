/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /.configs/vitest.config.mjs
 *	@Date: 2025-09-09T13:22:38-07:00 (1757449358)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-07T21:23:36-08:00 (1794115416)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

import { defineConfig, mergeConfig } from "vitest/config";
import { devCondition } from "@cldmv/configs/vitest.config.mjs";

import { fileURLToPath } from "node:url";
// Project root, so devCondition() reads this package's package.json.
const root = fileURLToPath(new URL("..", import.meta.url));

// `--mode=dist` (npm run test:dist) leaves the uuid-dev condition off, so tests that import "@cldmv/uuid" by name run
// against the build in dist/ instead of src/.
export default defineConfig(({ mode }) =>
	mergeConfig(
		mode === "dist" ? {} : devCondition({ root }),
		defineConfig({
			test: {
				include: ["test/**/*.test.vitest.{js,mjs,cjs}", "tests/**/*.test.vitest.{js,mjs,cjs}"],
				exclude: ["node_modules"],
				environment: "node",
				globals: true,
				testTimeout: 20000,
				env: {
					NODE_ENV: "uuid-dev"
				}
			}
		})
	)
);
