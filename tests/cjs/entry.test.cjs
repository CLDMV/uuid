/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /tests/cjs/entry.test.cjs
 *	@Date: 2026-10-03T10:18:01-07:00 (1791047881)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T12:13:44-08:00 (1793564024)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * Entry-point tests. These run under Node's own test runner (`node --test`), not Vitest:
 * Vitest loads files through its own module runner, so it cannot show whether a plain
 * `require()` of the package works the way it does for a CommonJS consumer. `test:cjs`
 * builds dist/ first and runs this file with --conditions=uuid-dev.
 */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "../..");
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const CJS_KEYS = ["ISSUER_CATEGORIES", "UUID", "uuid"];
const ESM_KEYS = ["ISSUER_CATEGORIES", "UUID", "default", "uuid"];

/**
 * Checks that a CJS entry keeps the historical shape: the UUID class itself as
 * module.exports, with UUID, uuid and ISSUER_CATEGORIES as properties, all the same
 * objects as the ESM entry's.
 * @param {Function} required - What require() returned.
 * @param {object} esm - The ESM namespace of the sibling index.mjs.
 */
function assertSameShape(required, esm) {
	assert.equal(typeof required, "function");
	assert.deepEqual(Object.keys(esm).sort(), ESM_KEYS);
	assert.equal(required, esm.default);
	for (const key of CJS_KEYS) {
		assert.ok(Object.hasOwn(required, key), key);
		assert.equal(required[key], esm[key], key);
	}
	assert.match(String(required.v4()), UUID_PATTERN);
}

/**
 * Runs an ESM snippet from the repo root with a scrubbed environment (no CI flags or
 * NODE_OPTIONS leaking in from the machine running the suite).
 * @param {string[]} nodeArgs - Extra node CLI flags.
 * @param {string} code - Module source to evaluate.
 * @returns {import("node:child_process").SpawnSyncReturns<string>} The child's result.
 */
function runModule(nodeArgs, code) {
	return spawnSync(process.execPath, [...nodeArgs, "--input-type=module", "-e", code], {
		cwd: repoRoot,
		env: { PATH: process.env.PATH },
		encoding: "utf8"
	});
}

test("dist: require() returns the same UUID object as import", async () => {
	const UUID = require("../../dist/index.cjs");
	const esm = await import("../../dist/index.mjs");
	assertSameShape(UUID, esm);
	assert.equal(UUID.name, "UUID");
	assert.match(String(UUID.TB()), UUID_PATTERN);
	assert.equal((await UUID.getIssuerInfo(2)).category, "Category A");
});

test("src: src/index.cjs loads from source with the same shape", async () => {
	const required = require("../../src/index.cjs");
	const esm = await import("../../src/index.mjs");
	assertSameShape(required, esm);
});

test("dist/index.cjs is a verbatim copy of src/index.cjs", () => {
	assert.equal(
		fs.readFileSync(path.join(repoRoot, "dist/index.cjs"), "utf8"),
		fs.readFileSync(path.join(repoRoot, "src/index.cjs"), "utf8")
	);
});

test("require() fails with a clear message where Node.js has no require(esm)", () => {
	// --no-experimental-require-module turns require(esm) off, which is what Node.js
	// versions before 20.19 / 22.13 look like to the entry.
	const res = spawnSync(process.execPath, ["--no-experimental-require-module", "-e", "require('./dist/index.cjs')"], {
		cwd: repoRoot,
		encoding: "utf8"
	});

	assert.notEqual(res.status, 0);
	assert.match(res.stderr, /ERR_REQUIRE_ESM/);
	assert.match(res.stderr, /require\(\) needs Node\.js \^20\.19\.0 or >=22\.13\.0/);
	assert.match(res.stderr, /import\(\)/);
});

test("the uuid-dev condition routes require() and import() of the package to src/", async () => {
	// This file runs with --conditions=uuid-dev (package.json "test:cjs"), so the package's
	// self-reference resolves through that branch of the "." export.
	assert.equal(require.resolve("@cldmv/uuid"), path.join(repoRoot, "src", "index.cjs"));
	assert.equal(require("@cldmv/uuid"), require("../../src/index.cjs"));
	const esm = await import("@cldmv/uuid");
	assert.equal(esm.UUID, (await import("../../src/index.mjs")).UUID);
});

test("without the condition the package resolves to dist/", () => {
	const res = runModule([], `console.log(import.meta.resolve("@cldmv/uuid"), import.meta.resolve("@cldmv/uuid/rng"));`);
	assert.equal(res.status, 0, res.stderr);
	const [root, rng] = res.stdout.trim().split(" ");
	assert.ok(root.endsWith("/dist/index.mjs"), root);
	assert.ok(rng.endsWith("/dist/lib/rng.mjs"), rng);
});

test("dist/index.mjs keeps the rng/bytes/hash subpaths external and inlines the issuer data", () => {
	const bundle = fs.readFileSync(path.join(repoRoot, "dist/index.mjs"), "utf8");
	// Kept as package imports, so a browser bundler still picks the "browser" variants.
	for (const subpath of ["rng", "bytes", "hash"]) assert.match(bundle, new RegExp(`["']@cldmv/uuid/${subpath}["']`), subpath);
	assert.doesNotMatch(bundle, /issuers\.json/);
	assert.match(bundle, /Example Corp/);
	for (const file of ["rng", "rng-browser", "bytes", "bytes-browser", "hash", "hash-browser"]) {
		assert.ok(fs.existsSync(path.join(repoRoot, "dist/lib", `${file}.mjs`)), `dist/lib/${file}.mjs is missing`);
	}
});

test("dist/main.mjs re-exports dist/index.mjs instead of carrying a second bundle", () => {
	const alias = fs.readFileSync(path.join(repoRoot, "dist/main.mjs"), "utf8");
	assert.match(alias, /from\s*["']\.\/index\.mjs["']/);
	assert.doesNotMatch(alias, /class \w+\{static\{/);
	assert.ok(alias.length < 1024, `dist/main.mjs is ${alias.length} bytes`);
});

test("the deprecated ./main alias warns once and exports the root's objects (dist)", () => {
	// dist/ is loaded by path, so no condition is needed.
	const ok = runModule(
		[],
		`const a = await import("./dist/main.mjs"); await import("./dist/main.mjs");
		const root = await import("./dist/index.mjs");
		if (a.UUID !== root.UUID || a.default !== root.default || a.uuid !== root.uuid || a.ISSUER_CATEGORIES !== root.ISSUER_CATEGORIES) process.exit(2);
		console.log(JSON.stringify(Object.keys(a).sort()));`
	);
	assert.equal(ok.status, 0, ok.stderr);
	assert.deepEqual(JSON.parse(ok.stdout), ESM_KEYS);
	assert.equal(ok.stderr.match(/CLDMV_UUID_MAIN/g)?.length, 1, ok.stderr);
	assert.match(ok.stderr, /DeprecationWarning: "@cldmv\/uuid\/main" is deprecated; import "@cldmv\/uuid" instead\./);
});
