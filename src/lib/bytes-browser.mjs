/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /src/lib/bytes-browser.mjs
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
 * Browser hex/byte helpers (selected via the "browser" export condition on ./bytes).
 * Pure Uint8Array implementation, no Node Buffer.
 *
 * Note: unlike Node's Buffer.from(hex, "hex") (which silently stops at the first
 * invalid hex character), fromHex() here throws on malformed input. This is a
 * deliberate, safety-improving divergence for the browser path only — it never
 * changes Node's existing behavior.
 */

const HEX_CHARS = "0123456789abcdef";

/**
 * Parse a hex string into bytes.
 * @param {string} hex - Hex string (no separators)
 * @returns {Uint8Array} Parsed bytes
 */
export function fromHex(hex) {
	if (hex.length % 2 !== 0) {
		throw new TypeError("Invalid hex string length");
	}

	const out = new Uint8Array(hex.length / 2);
	for (let i = 0; i < out.length; i++) {
		const byte = parseInt(hex.substr(i * 2, 2), 16);
		if (Number.isNaN(byte)) {
			throw new TypeError("Invalid hex string");
		}
		out[i] = byte;
	}
	return out;
}

/**
 * Encode bytes as a lowercase hex string.
 * @param {Uint8Array} bytes - Bytes to encode
 * @returns {string} Hex string
 */
export function toHex(bytes) {
	let hex = "";
	for (let i = 0; i < bytes.length; i++) {
		hex += HEX_CHARS[(bytes[i] >> 4) & 0xf] + HEX_CHARS[bytes[i] & 0xf];
	}
	return hex;
}

/**
 * Return a copy of `bytes` as the runtime's native Buffer-like type.
 * There is no Buffer in the browser, so this is a plain Uint8Array copy.
 * @param {Uint8Array} bytes - Bytes to wrap
 * @returns {Uint8Array} Copy of the bytes
 */
export function toBufferLike(bytes) {
	return Uint8Array.from(bytes);
}
