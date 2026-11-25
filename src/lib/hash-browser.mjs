/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /src/lib/hash-browser.mjs
 *	@Date: 2026-08-17T00:00:00-08:00 (1786953600)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T15:33:31-07:00 (1790980411)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * Browser MD5 / SHA-1 / SHA-256 (RFC 1321 / FIPS 180-1 / FIPS 180-4)
 *
 * Pure-JS, synchronous digests for environments without Node's `crypto` module.
 * `crypto.subtle.digest` is async and can't replace this without breaking the
 * synchronous v3()/v5() API. MD5/SHA-1 are used only as RFC 4122's specified
 * namespace-hash functions, not for anything security-sensitive. SHA-256 backs
 * EntropySource.createTimestampIndependentEntropy in `@cldmv/uuid/entropy`.
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
	7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11,
	16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
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

// SHA-256 round constants: the first 32 bits of the fractional parts of the cube roots of the
// first 64 primes (FIPS 180-4 Section 4.2.2)
const SHA256_K = new Uint32Array([
	0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be,
	0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa,
	0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85,
	0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
	0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
	0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

function rotr32(x, n) {
	return ((x >>> n) | (x << (32 - n))) >>> 0;
}

/**
 * Compute a SHA-256 digest (FIPS 180-4).
 * @param {Uint8Array} bytes - Message to hash
 * @returns {Uint8Array} 32-byte digest
 */
export function sha256(bytes) {
	const padded = padMessage(bytes, true);
	const view = new DataView(padded.buffer);

	const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
	const w = new Uint32Array(64);

	for (let chunkStart = 0; chunkStart < padded.length; chunkStart += 64) {
		for (let i = 0; i < 16; i++) {
			w[i] = view.getUint32(chunkStart + i * 4, false);
		}
		for (let i = 16; i < 64; i++) {
			const s0 = rotr32(w[i - 15], 7) ^ rotr32(w[i - 15], 18) ^ (w[i - 15] >>> 3);
			const s1 = rotr32(w[i - 2], 17) ^ rotr32(w[i - 2], 19) ^ (w[i - 2] >>> 10);
			w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
		}

		let [a, b, c, d, e, f, g, hh] = h;

		for (let i = 0; i < 64; i++) {
			const S1 = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
			const ch = (e & f) ^ (~e & g);
			const temp1 = (hh + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
			const S0 = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22);
			const maj = (a & b) ^ (a & c) ^ (b & c);
			const temp2 = (S0 + maj) >>> 0;

			hh = g;
			g = f;
			f = e;
			e = (d + temp1) >>> 0;
			d = c;
			c = b;
			b = a;
			a = (temp1 + temp2) >>> 0;
		}

		h[0] = (h[0] + a) >>> 0;
		h[1] = (h[1] + b) >>> 0;
		h[2] = (h[2] + c) >>> 0;
		h[3] = (h[3] + d) >>> 0;
		h[4] = (h[4] + e) >>> 0;
		h[5] = (h[5] + f) >>> 0;
		h[6] = (h[6] + g) >>> 0;
		h[7] = (h[7] + hh) >>> 0;
	}

	const digest = new Uint8Array(32);
	const digestView = new DataView(digest.buffer);
	for (let i = 0; i < 8; i++) {
		digestView.setUint32(i * 4, h[i], false);
	}
	return digest;
}
