/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /tests/resolve.test.vitest.mjs
 *	@Date: 2026-11-07T21:23:26-08:00 (1794115406)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-07T21:23:42-08:00 (1794115422)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * The tests import "@cldmv/uuid" by name, so the uuid-dev condition decides what they run against: src/ for `npm test`,
 * the build in dist/ for `npm run test:dist` (`--mode=dist`). This checks the name resolved to that tree.
 */
import { describe, it, expect } from "vitest";
import * as pkg from "@cldmv/uuid";

describe("the @cldmv/uuid import", () => {
	it(`resolves to ${import.meta.env.MODE === "dist" ? "dist/" : "src/"}`, async () => {
		const expected = import.meta.env.MODE === "dist" ? await import("../dist/index.mjs") : await import("../src/index.mjs");
		expect(pkg.UUID).toBe(expected.UUID);
		expect(pkg.ISSUER_CATEGORIES).toBe(expected.ISSUER_CATEGORIES);
		expect(pkg.default).toBe(expected.default);
	});
});
