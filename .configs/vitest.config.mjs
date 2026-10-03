/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /.configs/vitest.config.mjs
 *	@Date: 2025-09-09T13:22:38-07:00 (1757449358)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T15:33:22-07:00 (1790980402)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		// IMPORTANT: this *replaces* the defaults, so keep the usual ones too
		conditions: [
			"uuid-dev", // your custom branch
			"module",
			"browser",
			"development|production" // keep the special one for other deps
		]
	},
	ssr: {
		// Vitest often goes through SSR resolve pipeline even in node/jsdom tests
		resolve: {
			conditions: ["uuid-dev", "node", "development|production"]
		}
	},
	test: {
		include: ["test/**/*.test.vitest.{js,mjs,cjs}", "tests/**/*.test.vitest.{js,mjs,cjs}"],
		exclude: ["node_modules"],
		environment: "node",
		globals: true,
		testTimeout: 20000,
		nodeOptions: ["--conditions=uuid-dev"],
		env: {
			NODE_ENV: "uuid-dev"
		}
	}
});
