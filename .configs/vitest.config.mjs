/**
 *	@Project: @cldmv/uuid
 *	@Filename: /.configs/vitest.config.mjs
 *	@Date: 2025-09-09 13:22:38 -07:00 (1757449358)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-12-15 17:41:55 -08:00 (1765849315)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
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
		nodeOptions: ["--conditions=uuid-dev"],
		env: {
			NODE_ENV: "uuid-dev"
		}
	}
});
