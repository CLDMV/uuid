/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /src/lib/hash-browser.mjs
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
 * Browser MD5 / SHA-1 (RFC 1321 / FIPS 180-1)
 *
 * Pure-JS, synchronous digests for UUID v3/v5 namespace hashing in environments
 * without Node's `crypto` module. `crypto.subtle.digest` is async and can't
 * replace this without breaking the synchronous v3()/v5() API. MD5/SHA-1 are
 * used here only as RFC 4122's specified namespace-hash functions, not for
 * anything security-sensitive.
 */

const TEXT_ENCODER = new TextEncoder();

/**
 * Concatenate namespace bytes with the UTF-8 encoding of `name`.
 * @param {Uint8Array} namespaceBytes - 16-byte namespace UUID
 * @param {string} name - Name to hash
 * @returns {Uint8Array} Combined message
 */
function concatMessage(namespaceBytes, name) {
	const nameBytes = TEXT_ENCODER.encode(name);
	const combined = new Uint8Array(namespaceBytes.length + nameBytes.length);
	combined.set(namespaceBytes, 0);
	combined.set(nameBytes, namespaceBytes.length);
	return combined;
}

/**
 * Pad a message per the MD5/SHA-1 shared Merkle-Damgard scheme (both use the
 * same padding: 0x80, zeros, then a 64-bit length field).
 * @param {Uint8Array} message - Message to pad
 * @param {boolean} lengthBigEndian - true for SHA-1 (big-endian length), false for MD5 (little-endian length)
 * @returns {Uint8Array} Padded message, a multiple of 64 bytes
 */
function padMessage(message, lengthBigEndian) {
	const msgLen = message.length;
	const withOne = msgLen + 1;
	const padLen = (56 - (withOne % 64) + 64) % 64;
	const totalLen = withOne + padLen + 8;
	const padded = new Uint8Array(totalLen);
	padded.set(message, 0);
	padded[msgLen] = 0x80;

	const bitLen = BigInt(msgLen) * 8n;
	const view = new DataView(padded.buffer);
	if (lengthBigEndian) {
		view.setBigUint64(totalLen - 8, bitLen, false);
	} else {
		view.setBigUint64(totalLen - 8, bitLen, true);
	}

	return padded;
}

function rotl32(x, n) {
	return ((x << n) | (x >>> (32 - n))) >>> 0;
}

// MD5 per-round shift amounts (RFC 1321 Section 3.4)
const MD5_SHIFTS = [
	7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4,
	11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
];

// MD5 per-round additive constants: K[i] = floor(abs(sin(i + 1)) * 2^32) (RFC 1321 Section 3.4)
const MD5_K = new Uint32Array(64);
for (let i = 0; i < 64; i++) {
	MD5_K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
}

/**
 * Compute an MD5 digest (RFC 1321).
 * @param {Uint8Array} namespaceBytes - Namespace UUID bytes
 * @param {string} name - Name to hash
 * @returns {Uint8Array} 16-byte digest
 */
export function md5(namespaceBytes, name) {
	const padded = padMessage(concatMessage(namespaceBytes, name), false);
	const view = new DataView(padded.buffer);

	let a0 = 0x67452301;
	let b0 = 0xefcdab89;
	let c0 = 0x98badcfe;
	let d0 = 0x10325476;

	const M = new Uint32Array(16);
	for (let chunkStart = 0; chunkStart < padded.length; chunkStart += 64) {
		for (let i = 0; i < 16; i++) {
			M[i] = view.getUint32(chunkStart + i * 4, true);
		}

		let a = a0;
		let b = b0;
		let c = c0;
		let d = d0;

		for (let i = 0; i < 64; i++) {
			let f, g;
			if (i < 16) {
				f = (b & c) | (~b & d);
				g = i;
			} else if (i < 32) {
				f = (d & b) | (~d & c);
				g = (5 * i + 1) % 16;
			} else if (i < 48) {
				f = b ^ c ^ d;
				g = (3 * i + 5) % 16;
			} else {
				f = c ^ (b | ~d);
				g = (7 * i) % 16;
			}

			f = (f + a + MD5_K[i] + M[g]) >>> 0;
			a = d;
			d = c;
			c = b;
			b = (b + rotl32(f, MD5_SHIFTS[i])) >>> 0;
		}

		a0 = (a0 + a) >>> 0;
		b0 = (b0 + b) >>> 0;
		c0 = (c0 + c) >>> 0;
		d0 = (d0 + d) >>> 0;
	}

	const digest = new Uint8Array(16);
	const digestView = new DataView(digest.buffer);
	digestView.setUint32(0, a0, true);
	digestView.setUint32(4, b0, true);
	digestView.setUint32(8, c0, true);
	digestView.setUint32(12, d0, true);
	return digest;
}

/**
 * Compute a SHA-1 digest (FIPS 180-1 / RFC 3174).
 * @param {Uint8Array} namespaceBytes - Namespace UUID bytes
 * @param {string} name - Name to hash
 * @returns {Uint8Array} 20-byte digest
 */
export function sha1(namespaceBytes, name) {
	const padded = padMessage(concatMessage(namespaceBytes, name), true);
	const view = new DataView(padded.buffer);

	let h0 = 0x67452301;
	let h1 = 0xefcdab89;
	let h2 = 0x98badcfe;
	let h3 = 0x10325476;
	let h4 = 0xc3d2e1f0;

	const w = new Uint32Array(80);
	for (let chunkStart = 0; chunkStart < padded.length; chunkStart += 64) {
		for (let i = 0; i < 16; i++) {
			w[i] = view.getUint32(chunkStart + i * 4, false);
		}
		for (let i = 16; i < 80; i++) {
			w[i] = rotl32(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
		}

		let a = h0;
		let b = h1;
		let c = h2;
		let d = h3;
		let e = h4;

		for (let i = 0; i < 80; i++) {
			let f, k;
			if (i < 20) {
				f = (b & c) | (~b & d);
				k = 0x5a827999;
			} else if (i < 40) {
				f = b ^ c ^ d;
				k = 0x6ed9eba1;
			} else if (i < 60) {
				f = (b & c) | (b & d) | (c & d);
				k = 0x8f1bbcdc;
			} else {
				f = b ^ c ^ d;
				k = 0xca62c1d6;
			}

			const temp = (rotl32(a, 5) + f + e + k + w[i]) >>> 0;
			e = d;
			d = c;
			c = rotl32(b, 30);
			b = a;
			a = temp;
		}

		h0 = (h0 + a) >>> 0;
		h1 = (h1 + b) >>> 0;
		h2 = (h2 + c) >>> 0;
		h3 = (h3 + d) >>> 0;
		h4 = (h4 + e) >>> 0;
	}

	const digest = new Uint8Array(20);
	const digestView = new DataView(digest.buffer);
	digestView.setUint32(0, h0, false);
	digestView.setUint32(4, h1, false);
	digestView.setUint32(8, h2, false);
	digestView.setUint32(12, h3, false);
	digestView.setUint32(16, h4, false);
	return digest;
}
