/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /src/lib/bytes.mjs
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
 * Node hex/byte helpers (selected via the "browser" export condition on ./bytes).
 * Backed by Node's native Buffer for speed; accepts either a Buffer or a plain
 * Uint8Array as input since internal UUID buffers are plain Uint8Array.
 */
/**
 * Parse a hex string into bytes.
 * @param {string} hex - Hex string (no separators)
 * @returns {Uint8Array} Parsed bytes
 */
export function fromHex(hex: string): Uint8Array;
/**
 * Encode bytes as a lowercase hex string.
 * @param {Uint8Array} bytes - Bytes to encode
 * @returns {string} Hex string
 */
export function toHex(bytes: Uint8Array): string;
/**
 * Return a copy of `bytes` as the runtime's native Buffer-like type.
 * In Node this is a real Buffer (preserves the pre-existing toBuffer() contract).
 * @param {Uint8Array} bytes - Bytes to wrap
 * @returns {Buffer} Copy of the bytes as a Buffer
 */
export function toBufferLike(bytes: Uint8Array): Buffer;
//# sourceMappingURL=bytes.d.mts.map