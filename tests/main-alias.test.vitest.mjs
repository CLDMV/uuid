/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /tests/main-alias.test.vitest.mjs
 *	@Date: 2026-11-01T12:10:50-08:00 (1793563850)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T12:13:45-08:00 (1793564025)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * Tests for the deprecated "@cldmv/uuid/main" alias (src/main.mjs). It re-exports the
 * package root and warns once per process with code CLDMV_UUID_MAIN.
 */

import { test, expect, describe, vi, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MESSAGE = '"@cldmv/uuid/main" is deprecated; import "@cldmv/uuid" instead.';

afterEach(() => {
	vi.restoreAllMocks();
});

describe("@cldmv/uuid/main (deprecated alias)", () => {
	test("warns once with code CLDMV_UUID_MAIN and exports the root's objects", async () => {
		const emitWarning = vi.spyOn(process, "emitWarning").mockImplementation(() => {});

		const alias = await import("@cldmv/uuid/main");
		await import("@cldmv/uuid/main");
		const root = await import("@cldmv/uuid");

		expect(emitWarning).toHaveBeenCalledTimes(1);
		expect(emitWarning).toHaveBeenCalledWith(MESSAGE, { type: "DeprecationWarning", code: "CLDMV_UUID_MAIN" });

		expect(Object.keys(alias).sort()).toEqual(Object.keys(root).sort());
		expect(Object.keys(alias).sort()).toEqual(["ISSUER_CATEGORIES", "UUID", "default", "uuid"]);
		for (const key of Object.keys(root)) expect(alias[key], key).toBe(root[key]);
	});

	test("falls back to console.warn where process.emitWarning is unavailable", async () => {
		vi.resetModules();
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const emitWarning = process.emitWarning;
		process.emitWarning = undefined;
		try {
			const alias = await import("@cldmv/uuid/main");
			expect(typeof alias.UUID).toBe("function");
		} finally {
			process.emitWarning = emitWarning;
		}
		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn).toHaveBeenCalledWith(`DeprecationWarning: ${MESSAGE}`);
	});

	test("prints the warning once per process under plain Node.js, silenced by --no-deprecation", () => {
		const code = `const a = await import("@cldmv/uuid/main"); await import("@cldmv/uuid/main");
			const { UUID } = await import("@cldmv/uuid");
			if (a.UUID !== UUID) process.exit(2);`;
		const run = (args) =>
			spawnSync(process.execPath, ["--conditions=uuid-dev", ...args, "--input-type=module", "-e", code], {
				cwd: repoRoot,
				env: { PATH: process.env.PATH },
				encoding: "utf8"
			});

		const loud = run([]);
		expect(loud.status, loud.stderr).toBe(0);
		expect(loud.stderr.match(/CLDMV_UUID_MAIN/g)).toHaveLength(1);

		const quiet = run(["--no-deprecation"]);
		expect(quiet.status, quiet.stderr).toBe(0);
		expect(quiet.stderr).not.toMatch(/CLDMV_UUID_MAIN/);
	});
});
