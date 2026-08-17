/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /src/lib/hash.mjs
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
 * Node MD5/SHA-1 (selected via the "browser" export condition on ./hash).
 * Used only for RFC 4122 v3/v5 namespace hashing, not for anything security-sensitive.
 */

import crypto from "crypto";

/**
 * Compute an MD5 digest of namespaceBytes || utf8(name).
 * @param {Uint8Array} namespaceBytes - Namespace UUID bytes
 * @param {string} name - Name to hash
 * @returns {Uint8Array} 16-byte digest
 */
export function md5(namespaceBytes, name) {
	return crypto.createHash("md5").update(namespaceBytes).update(name, "utf8").digest();
}

/**
 * Compute a SHA-1 digest of namespaceBytes || utf8(name).
 * @param {Uint8Array} namespaceBytes - Namespace UUID bytes
 * @param {string} name - Name to hash
 * @returns {Uint8Array} 20-byte digest
 */
export function sha1(namespaceBytes, name) {
	return crypto.createHash("sha1").update(namespaceBytes).update(name, "utf8").digest();
}
