/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /index.mjs
 *	@Date: 2025-12-15T16:18:10-08:00 (1765844290)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T09:26:21-08:00 (1793553981)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * ESM entry point for UUID
 *
 * Re-exports all components from the main UUID module
 */
import { UUID, ISSUER_CATEGORIES } from "@cldmv/uuid/main";

export { UUID as default, UUID, UUID as uuid, ISSUER_CATEGORIES };
