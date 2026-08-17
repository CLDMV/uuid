/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /src/lib/rng-browser.mjs
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
 * Browser entropy source (selected via the "browser" export condition on ./rng)
 */

/**
 * Generate cryptographically secure random bytes via the Web Crypto API.
 * @param {number} byteCount - Number of bytes to generate
 * @returns {Uint8Array} Random bytes
 */
export function randomBytes(byteCount) {
	if (typeof globalThis.crypto?.getRandomValues !== "function") {
		throw new Error("No secure random source available: globalThis.crypto.getRandomValues is missing.");
	}
	return globalThis.crypto.getRandomValues(new Uint8Array(byteCount));
}
