/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /.configs/eslint.config.mjs
 *	@Date: 2025-12-15T20:33:49-08:00 (1765859629)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T15:33:21-07:00 (1790980401)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

import base from "@cldmv/configs/eslint.config.mjs";
import { defineConfig } from "eslint/config";

export default defineConfig([
	...base,
	// Generated declaration output (npm run types:build) is not hand-authored.
	{ ignores: ["types/**"] }
]);
