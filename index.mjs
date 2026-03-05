/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /index.mjs
 *	@Date: 2025-12-15 16:18:10 -08:00 (1765844290)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-03-04 21:03:43 -08:00 (1772687023)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

// Development environment check (must happen before UUID imports)
try {
	await import("./devcheck.mjs");
} catch {
	// ignore
}

/**
 * ESM entry point for UUID
 *
 * Re-exports all components from the main UUID module
 */
const { UUID, ISSUER_CATEGORIES } = await import("@cldmv/uuid/main");

export { UUID, UUID as uuid, ISSUER_CATEGORIES };
export default UUID;
