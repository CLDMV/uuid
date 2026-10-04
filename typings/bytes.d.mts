/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /typings/bytes.d.mts
 *	@Date: 2026-10-03T18:00:00-07:00 (1791075600)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-03T18:00:00-07:00 (1791075600)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * The byte container the package returns (toBuffer(), the RFC generators' `buf` results)
 * outside Node: a plain Uint8Array. package.json `imports` maps `#bytes-type` here unless
 * the consumer resolves with the `node` condition (see bytes-node.d.mts).
 */
export type Bytes = Uint8Array;
