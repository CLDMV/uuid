/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /tests/uuid-details-doc.test.vitest.mjs
 *	@Date: 2026-11-25T00:10:00-08:00 (1795594200)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-25T00:10:00-08:00 (1795594200)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * docs/reference/uuid-details.md is generated from the library. This fails when the
 * committed page no longer matches what the code returns; run `npm run docs:details`.
 */

import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { UUID } from "@cldmv/uuid";
import { renderUuidDetails, renderUuidDetailsHtml, OUTPUT } from "../scripts/generate-uuid-details.mjs";

describe("UUID detail reference", () => {
	test(`${OUTPUT} matches the library (run npm run docs:details)`, async () => {
		const committed = readFileSync(new URL(`../${OUTPUT}`, import.meta.url), "utf8");
		expect(committed).toBe(await renderUuidDetails(UUID));
	});

	test("the HTML page fills every placeholder and carries every id", async () => {
		const page = await renderUuidDetailsHtml(UUID, "9.9.9");
		expect(page).not.toMatch(/__[A-Z_]+__/);
		expect(page).toContain("@cldmv/uuid v9.9.9");
		const data = JSON.parse(page.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
		expect(data.ids.map((x) => x.label)).toContain("RFC v7");
		expect(data.ids.every((x) => x.sections.length === data.tabs.length)).toBe(true);
		expect(data.order).toHaveLength(data.ids.length);
	});
});
