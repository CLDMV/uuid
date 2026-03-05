/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /scripts/test-timestamp.mjs
 *	@Date: 2025-12-19T20:14:21-08:00 (1766204061)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-03-04 21:03:43 -08:00 (1772687023)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

import { UUID } from "../src/uuid.mjs";

const timestamp = 1766202473379;
console.log("Input timestamp:", timestamp);

// Create UUID without any custom entropy
const uuid = UUID.TB(timestamp);
const extracted = uuid.getTimestamp();

console.log("Extracted:", extracted);
console.log("Match:", extracted === timestamp);
console.log("Difference:", extracted - timestamp);
