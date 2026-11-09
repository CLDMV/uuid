/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /tests/entropy-browser.test.vitest.mjs
 *	@Date: 2026-11-09T04:31:07-08:00 (1794227467)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-09T04:45:36-08:00 (1794228336)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * UUID.entropy() in the browser (uuid#102, uuid#21): the helper must not reach a Node
 * builtin. Its only imports are the package's rng and hash subpaths; here they are swapped
 * for their browser variants (what the "browser" export condition picks), so the helper runs
 * on Web Crypto and the pure-JS SHA-1.
 */

import { afterEach, describe, expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

vi.mock("@cldmv/uuid/rng", () => import("../src/lib/rng-browser.mjs"));
vi.mock("@cldmv/uuid/hash", () => import("../src/lib/hash-browser.mjs"));

// Through the package entry, so `npm run test:dist` runs the build: dist/ keeps the rng and
// hash subpaths external, so the mocks above replace them there too.
const { UUID } = await import("@cldmv/uuid");
const entropy = (options) => UUID.entropy(options);

afterEach(() => {
	vi.restoreAllMocks();
});

describe("entropy() on the browser modules", () => {
	test("imports nothing but the package's rng and hash subpaths", () => {
		const source = readFileSync(new URL("../src/lib/entropy.mjs", import.meta.url), "utf8");
		const specifiers = [...source.matchAll(/^\s*import\b[^"']*["']([^"']+)["']/gm)].map((m) => m[1]);
		const dynamic = [...source.matchAll(/\bimport\s*\(|\brequire\s*\(/g)];
		expect(specifiers.sort()).toEqual(["@cldmv/uuid/hash", "@cldmv/uuid/rng"]);
		expect(dynamic).toEqual([]);
	});

	test("draws its randomness from Web Crypto", () => {
		const spy = vi.spyOn(globalThis.crypto, "getRandomValues");
		entropy();
		expect(spy).toHaveBeenCalled();
	});

	test("returns a plain Uint8Array, not a Node Buffer", () => {
		const e = entropy({ seed: "browser" });
		expect(e).toBeInstanceOf(Uint8Array);
		expect(Buffer.isBuffer(e)).toBe(false);
	});

	test("the pure-JS SHA-1 gives the same seed bits as node:crypto", () => {
		for (const seed of ["rummage · main", "", "quack"]) {
			const e = entropy({ seed });
			let value = e[9] & 1;
			for (let i = 10; i < 16; i++) value = value * 256 + e[i];
			const digest = createHash("sha1").update(seed, "utf8").digest();
			expect(Math.floor(value / 2 ** 21) % 2 ** 16).toBe((digest[0] << 8) | digest[1]);
		}
		const bytes = new TextEncoder().encode("bytes seed");
		const e = entropy({ seed: bytes });
		let value = e[9] & 1;
		for (let i = 10; i < 16; i++) value = value * 256 + e[i];
		const digest = createHash("sha1").update(bytes).digest();
		expect(Math.floor(value / 2 ** 21) % 2 ** 16).toBe((digest[0] << 8) | digest[1]);
	});

	test("many calls in one millisecond never repeat", () => {
		vi.spyOn(Date, "now").mockReturnValue(1794247200999);
		const seen = new Set();
		for (let i = 0; i < 2048; i++) {
			const e = entropy({ seed: "browser" });
			seen.add(`${e.timestamp}:${Array.from(e).join(",")}`);
		}
		expect(seen.size).toBe(2048);
	});
});
