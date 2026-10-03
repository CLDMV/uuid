/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /src/lib/rng.mjs
 *	@Date: 2026-08-17T00:00:00-08:00 (1786953600)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T15:33:32-07:00 (1790980412)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * Node entropy source (selected via the "browser" export condition on ./rng)
 */

import crypto from "crypto";

/**
 * Generate cryptographically secure random bytes.
 * @param {number} byteCount - Number of bytes to generate
 * @returns {Uint8Array} Random bytes (a Node Buffer, which is a Uint8Array)
 */
export function randomBytes(byteCount) {
	return crypto.randomBytes(byteCount);
}
