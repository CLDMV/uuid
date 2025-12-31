/**
 * RFC 4122 UUID Versions 3 and 5 - Namespace-based UUIDs
 *
 * Version 3: MD5-based namespace UUID
 * Version 5: SHA-1-based namespace UUID
 */

import crypto from "crypto";
import { parse, stringify } from "./utils.mjs";

/**
 * Internal function for v3 and v5 UUID generation
 * @param {string} name - Name to hash
 * @param {string|Uint8Array} namespace - Namespace UUID
 * @param {number} versionByte - Version byte (0x30 for v3, 0x50 for v5)
 * @param {Object} hasher - Crypto hash instance
 * @param {Uint8Array} buf - Optional buffer to write into
 * @param {number} offset - Optional offset in buffer
 * @returns {string|Uint8Array} UUID string or buffer
 * @private
 */
function _v35(name, namespace, versionByte, hasher, buf, offset) {
	const _buf = buf || new Uint8Array(16);
	const _offset = offset || 0;

	// Parse namespace
	let namespaceBytes;
	if (typeof namespace === "string") {
		namespaceBytes = parse(namespace);
	} else {
		namespaceBytes = namespace;
	}

	// Hash namespace + name
	hasher.update(Buffer.from(namespaceBytes));
	hasher.update(name, "utf8");
	const hash = hasher.digest();

	// Copy first 16 bytes of hash to buffer
	for (let i = 0; i < 16; i++) {
		_buf[_offset + i] = hash[i];
	}

	// Set version
	_buf[_offset + 6] = (_buf[_offset + 6] & 0x0f) | versionByte;

	// Set variant
	_buf[_offset + 8] = (_buf[_offset + 8] & 0x3f) | 0x80;

	return buf ? _buf : stringify(_buf);
}

/**
 * Create a version 3 (namespace with MD5) UUID
 * @param {string} name - Name to hash
 * @param {string|Uint8Array} namespace - Namespace UUID
 * @param {Uint8Array} buf - Optional buffer to write into
 * @param {number} offset - Optional offset in buffer
 * @returns {string|Uint8Array} UUID string or buffer
 */
export function v3(name, namespace, buf, offset) {
	return _v35(name, namespace, 0x30, crypto.createHash("md5"), buf, offset);
}

/**
 * Create a version 5 (namespace with SHA-1) UUID
 * @param {string} name - Name to hash
 * @param {string|Uint8Array} namespace - Namespace UUID
 * @param {Uint8Array} buf - Optional buffer to write into
 * @param {number} offset - Optional offset in buffer
 * @returns {string|Uint8Array} UUID string or buffer
 */
export function v5(name, namespace, buf, offset) {
	return _v35(name, namespace, 0x50, crypto.createHash("sha1"), buf, offset);
}
