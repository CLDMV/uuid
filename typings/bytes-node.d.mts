/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /typings/bytes-node.d.mts
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
 * The byte container the package returns in Node: a Buffer (a Uint8Array subclass).
 * package.json `imports` maps `#bytes-type` here under the `node` condition, which
 * TypeScript applies with `module`/`moduleResolution` `node16`/`nodenext`.
 *
 * Buffer is read from the global scope instead of through `/// <reference types="node" />`,
 * so importing this package never forces Node's globals into a project. With @types/node
 * loaded, `Bytes` is Buffer; without it, it falls back to Uint8Array (which Buffer extends).
 */
type NodeBuffer = typeof globalThis extends { Buffer: { alloc(size: number): infer B } } ? B : never;

export type Bytes = [NodeBuffer] extends [never] ? Uint8Array : NodeBuffer;
