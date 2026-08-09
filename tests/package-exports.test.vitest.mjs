/**
 *	@Project: @cldmv/uuid
 *	@Filename: /tests/package-exports.test.vitest.mjs
 *	@Date: 2026-08-09T00:00:00-08:00 (1786233600)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-08-09T00:00:00-08:00 (1786233600)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

import { test, expect, describe } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("package exports", () => {
	test("the exports map exposes ./package.json", () => {
		// Tooling resolves `<pkg>/package.json` to locate a package's directory on disk;
		// omitting it from `exports` makes that throw ERR_PACKAGE_PATH_NOT_EXPORTED. (#6)
		const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
		expect(pkg.exports["./package.json"]).toBe("./package.json");
	});

	test("Node can resolve @cldmv/uuid/package.json through the exports map", () => {
		// Real Node resolution (self-referencing the package by name from the repo root),
		// not Vitest's resolver — before the fix this exits non-zero with
		// ERR_PACKAGE_PATH_NOT_EXPORTED.
		const res = spawnSync(process.execPath, ["--input-type=module", "-e", "import.meta.resolve('@cldmv/uuid/package.json');"], {
			cwd: repoRoot,
			encoding: "utf8"
		});
		expect(res.status).toBe(0);
	});
});
