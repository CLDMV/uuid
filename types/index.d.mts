/**
 *	@Project: @cldmv/uuid
 *	@Filename: /types/index.d.mts
 *	@Date: 2026-03-04 21:19:55 -08:00 (1772687995)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-03-04 21:19:57 -08:00 (1772687997)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

export default UUID;
export const UUID: typeof import("@cldmv/uuid/main").UUID;
export const ISSUER_CATEGORIES: {
	UNASSIGNED: number;
	DRAFTER_RESERVED: number;
	CATEGORY_A_START: number;
	CATEGORY_A_END: number;
	CATEGORY_B_START: number;
	CATEGORY_B_END: number;
	SPEC_ORIGINATOR: number;
	RFC_EXPANSION_START: number;
	RFC_EXPANSION_END: number;
};
export { UUID as uuid };
//# sourceMappingURL=index.d.mts.map
