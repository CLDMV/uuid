/**
 *	@Project: @cldmv/uuid
 *	@Filename: /tests/browser-modules.test.vitest.mjs
 *	@Date: 2026-08-17T00:00:00-08:00 (0)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-08-17T00:00:00-08:00 (0)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Vitest Test Suite for the browser-variant isomorphic modules (rng-browser,
 * bytes-browser, hash-browser). These are only reached at runtime via the
 * "browser" export condition, which Node's test run never sets, so they're
 * imported here directly by relative path to get real coverage of the logic.
 * See https://github.com/CLDMV/uuid/issues/22 for actually running them in a
 * real browser end-to-end.
 */

import { describe, test, expect } from "vitest";
import crypto from "crypto";
import { randomBytes as randomBytesBrowser } from "../src/lib/rng-browser.mjs";
import { fromHex as fromHexBrowser, toHex as toHexBrowser, toBufferLike as toBufferLikeBrowser } from "../src/lib/bytes-browser.mjs";
import { fromHex as fromHexNode, toHex as toHexNode } from "../src/lib/bytes.mjs";
import { md5 as md5Browser, sha1 as sha1Browser } from "../src/lib/hash-browser.mjs";
import { md5 as md5Node, sha1 as sha1Node } from "../src/lib/hash.mjs";

describe("rng-browser", () => {
	test("returns a Uint8Array of the requested length", () => {
		const bytes = randomBytesBrowser(16);
		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(bytes.length).toBe(16);
	});

	test("returns different values across calls (not deterministic)", () => {
		const a = randomBytesBrowser(16);
		const b = randomBytesBrowser(16);
		expect(Array.from(a)).not.toEqual(Array.from(b));
	});

	test("throws a clear error when globalThis.crypto.getRandomValues is unavailable", () => {
		const original = globalThis.crypto;
		// eslint-disable-next-line no-undef
		Object.defineProperty(globalThis, "crypto", { value: undefined, configurable: true });
		try {
			expect(() => randomBytesBrowser(16)).toThrow(/getRandomValues/);
		} finally {
			Object.defineProperty(globalThis, "crypto", { value: original, configurable: true });
		}
	});
});

describe("bytes-browser", () => {
	test("fromHex/toHex round-trip matches the Node implementation", () => {
		const samples = ["", "00", "ff", "6ba7b8109dad11d180b400c04fd430c8", "0123456789abcdef"];
		for (const hex of samples) {
			const browserBytes = fromHexBrowser(hex);
			const nodeBytes = fromHexNode(hex);
			expect(Array.from(browserBytes)).toEqual(Array.from(nodeBytes));
			expect(toHexBrowser(browserBytes)).toBe(hex);
			expect(toHexBrowser(browserBytes)).toBe(toHexNode(nodeBytes));
		}
	});

	test("fromHex throws on odd-length input", () => {
		expect(() => fromHexBrowser("abc")).toThrow(TypeError);
	});

	test("fromHex throws on non-hex characters", () => {
		expect(() => fromHexBrowser("zz")).toThrow(TypeError);
	});

	test("toBufferLike returns a Uint8Array copy, not a view", () => {
		const source = new Uint8Array([1, 2, 3]);
		const copy = toBufferLikeBrowser(source);
		expect(Array.from(copy)).toEqual([1, 2, 3]);
		copy[0] = 99;
		expect(source[0]).toBe(1);
	});
});

describe("hash-browser", () => {
	// Vectors generated from node:crypto directly (not hand-transcribed) to rule out transcription error.
	const md5Vectors = [
		["", "d41d8cd98f00b204e9800998ecf8427e"],
		["abc", "900150983cd24fb0d6963f7d28e17f72"],
		["message digest", "f96b697d7cb7938d525a2f31aaf161d0"],
		["abcdefghijklmnopqrstuvwxyz", "c3fcd3d76192e4007dfb496cca67e13b"]
	];

	const sha1Vectors = [
		["", "da39a3ee5e6b4b0d3255bfef95601890afd80709"],
		["abc", "a9993e364706816aba3e25717850c26c9cd0d89d"],
		["abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq", "84983e441c3bd26ebaae4aa1f95129e5e54670f1"]
	];

	const empty = new Uint8Array(0);

	test.each(md5Vectors)("md5 matches RFC 1321 vector for %j", (input, expected) => {
		expect(toHexBrowser(md5Browser(empty, input))).toBe(expected);
	});

	test.each(sha1Vectors)("sha1 matches FIPS 180-1 vector for %j", (input, expected) => {
		expect(toHexBrowser(sha1Browser(empty, input))).toBe(expected);
	});

	test("md5/sha1 match node:crypto across varied and multi-block inputs", () => {
		const inputs = ["", "a", "hello world", "x".repeat(1000), "The quick brown fox jumps over the lazy dog"];
		for (const input of inputs) {
			const nodeMd5 = crypto.createHash("md5").update(input, "utf8").digest("hex");
			const nodeSha1 = crypto.createHash("sha1").update(input, "utf8").digest("hex");
			expect(toHexBrowser(md5Browser(empty, input))).toBe(nodeMd5);
			expect(toHexBrowser(sha1Browser(empty, input))).toBe(nodeSha1);
		}
	});

	test("matches the Node hash.mjs implementation given a real namespace", () => {
		// RFC 4122 DNS namespace UUID
		const ns = fromHexNode("6ba7b8109dad11d180b400c04fd430c8");
		const name = "www.example.com";
		expect(toHexBrowser(md5Browser(ns, name))).toBe(toHexNode(md5Node(ns, name)));
		expect(toHexBrowser(sha1Browser(ns, name))).toBe(toHexNode(sha1Node(ns, name)));
	});
});
