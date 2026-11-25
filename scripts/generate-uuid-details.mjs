/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /scripts/generate-uuid-details.mjs
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
 * Generates docs/reference/uuid-details.md: what every detail method returns for one id
 * of each RFC version, the Nil, Max and Microsoft ids, and each kind of CLDMV id. Every id
 * is built from fixed inputs, so the output only changes when the library does.
 * tests/uuid-details-doc.test.vitest.mjs fails when the committed page is out of date.
 *
 * Run: npm run docs:details
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

export const OUTPUT = "docs/reference/uuid-details.md";

const MS = 1700000000000;
const ENTROPY = new Uint8Array(16).fill(0x5a);
const RANDOM = Uint8Array.from({ length: 16 }, (_, i) => (i * 37 + 11) & 255);
const TIME = { msecs: MS, nsecs: 0, clockseq: 0x1234, node: [1, 2, 3, 4, 5, 6] };

/**
 * An RFC v7 id at a fixed time with fixed random bits (v7() takes no random input).
 * @param {typeof import("../src/uuid.mjs").UUID} UUID - The UUID class
 * @returns {string} UUID string
 */
function fixedV7(UUID) {
	const bytes = UUID.v7({ msecs: MS, buf: new Uint8Array(16) });
	bytes.set(RANDOM.subarray(6), 6);
	bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
	bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
	return UUID.stringify(bytes);
}

/**
 * The ids the page describes, built from fixed inputs.
 * @param {typeof import("../src/uuid.mjs").UUID} UUID - The UUID class
 * @returns {Array<{ group: string, label: string, id: string, made: string }>} Ids
 */
function sampleIds(UUID) {
	return [
		["RFC 4122/9562", "RFC v1", UUID.v1(TIME), "UUID.v1({ msecs: 1700000000000, clockseq: 0x1234, node })"],
		["RFC 4122/9562", "RFC v3", UUID.v3("example.com", UUID.DNS), 'UUID.v3("example.com", UUID.DNS)'],
		["RFC 4122/9562", "RFC v4", UUID.v4({ random: RANDOM }), "UUID.v4({ random })"],
		["RFC 4122/9562", "RFC v5", UUID.v5("example.com", UUID.DNS), 'UUID.v5("example.com", UUID.DNS)'],
		["RFC 4122/9562", "RFC v6", UUID.v6(TIME), "UUID.v6({ msecs: 1700000000000, clockseq: 0x1234, node })"],
		["RFC 4122/9562", "RFC v7", fixedV7(UUID), "UUID.v7({ msecs: 1700000000000 }) with its random bits fixed"],
		["RFC 4122/9562", "RFC v8", UUID.v8({ data: RANDOM }), "UUID.v8({ data })"],
		["RFC 4122/9562", "Nil", UUID.NIL, "UUID.NIL"],
		["RFC 4122/9562", "Max", UUID.MAX, "UUID.MAX"],
		["Microsoft", "Microsoft GUID", "00000000-0000-0000-c000-000000000046", "IUnknown, variant 110"],
		["CLDMV", "TA", UUID.TA(1700000000, ENTROPY).toString(), "UUID.TA(1700000000)"],
		["CLDMV", "TB", UUID.TB(MS, ENTROPY).toString(), "UUID.TB(1700000000000)"],
		["CLDMV", "TB before 1970", UUID.TB(-MS, ENTROPY).toString(), "UUID.TB(-1700000000000)"],
		["CLDMV", "TA v1 (legacy layout)", UUID.timestamp(1700000000, 1, ENTROPY).toString(), "UUID.timestamp(1700000000, 1)"],
		["CLDMV", "TB v2 (legacy layout)", UUID.timestamp(MS, 2, ENTROPY).toString(), "UUID.timestamp(1700000000000, 2)"],
		["CLDMV", "TA v3 (ordered layout)", UUID.timestamp(1700000000, 3, ENTROPY).toString(), "UUID.timestamp(1700000000, 3)"],
		["CLDMV", "TB v4 (ordered layout)", UUID.timestamp(MS, 4, ENTROPY).toString(), "UUID.timestamp(1700000000000, 4)"],
		["CLDMV", "IA, issuer 100", UUID.IA(100, ENTROPY).toString(), "UUID.IA(100)"],
		["CLDMV", "IA, issuer 404", UUID.IA(404, ENTROPY).toString(), "UUID.IA(404)"],
		["CLDMV", "IA, issuer 700", UUID.IA(700, ENTROPY).toString(), "UUID.IA(700)"]
	].map(([group, label, id, made]) => ({ group, label, id, made }));
}

/**
 * Format a value as it would read in code.
 * @param {unknown} value - Value to format
 * @returns {string} Markdown code span
 */
function code(value) {
	let text;
	if (typeof value === "bigint") text = `${value}n`;
	else if (value === undefined) text = "undefined";
	else if (typeof value === "string") text = JSON.stringify(value);
	else text = JSON.stringify(value, (_key, x) => (typeof x === "bigint" ? `${x}n` : x));
	return "`" + text.replace(/\|/g, "\\|") + "`";
}

/**
 * GitHub's anchor for a heading.
 * @param {string} heading - Heading text
 * @returns {string} Anchor
 */
function anchor(heading) {
	return heading
		.toLowerCase()
		.replace(/[^a-z0-9 _-]/g, "")
		.replace(/ /g, "-");
}

/**
 * A collapsible two-column table.
 * @param {string} title - Summary text
 * @param {Array<[string, unknown]>} rows - Field / value pairs
 * @param {boolean} [open] - Open by default
 * @returns {string} Markdown
 */
function section(title, rows, open = false) {
	return [
		`<details${open ? " open" : ""}><summary><code>${title}</code></summary>`,
		"",
		"| Field | Value |",
		"| --- | --- |",
		...rows.map(([key, value]) => `| \`${key}\` | ${code(value)} |`),
		"",
		"</details>",
		""
	].join("\n");
}

/**
 * Render the reference page.
 * @param {typeof import("../src/uuid.mjs").UUID} UUID - The UUID class to describe ids with
 * @returns {Promise<string>} Markdown
 */
export async function renderUuidDetails(UUID) {
	const ids = sampleIds(UUID);
	const out = [];
	out.push(
		"<!-- Generated by `npm run docs:details` (scripts/generate-uuid-details.mjs). Don't edit by hand. -->",
		"",
		"# UUID detail reference",
		"",
		"What every detail method returns for one id of each RFC 4122/9562 version, the Nil, Max and Microsoft ids, and each kind of CLDMV id. Each id is built from the fixed inputs shown, and the page is generated from the library, so the values are exactly what the code returns.",
		"",
		"## Reading the fields",
		"",
		"- Every id gets the same fields. A field the id's variant doesn't define is `null`.",
		"- `variant` in `getInfo()` is the family's number: RFC 4122/9562 `2` (prefix `10`, Nil and Max included), Microsoft `6` (`110`), CLDMV `7` (`111`), NCS `0`. `getVariant()` and `bitLayout.variant` are the raw bits 64-66, which read `4` or `5` on an RFC id because RFC only claims two of the three bits.",
		"- `version` is bits 75-78 on a CLDMV id and the RFC version (bits 48-51) on an RFC id. `getVersion()` always reads bits 75-78.",
		"- `fullVersion` is `variant.subvariant.version` as numbers, `0` for a part the id doesn't have.",
		"- `timestamp` is on the Unix epoch in `timestampUnit`: seconds for TA, milliseconds for TB and RFC v7, 100-ns intervals for RFC v1 and v6.",
		"- `isUUID` is true for a well-formed UUID; `isCLDMV` marks the TA, TB and IA ids this library defines.",
		"",
		"## Ids",
		""
	);
	for (const group of [...new Set(ids.map((x) => x.group))]) {
		out.push(
			`- **${group}:** ${ids
				.filter((x) => x.group === group)
				.map((x) => `[${x.label}](#${anchor(x.label)})`)
				.join(", ")}`
		);
	}
	out.push("- [`UUID.compare` order](#uuidcompare-order)", "");

	for (const { label, id, made } of ids) {
		const uuid = new UUID(id);
		const report = await UUID.validateDetailed(id);
		const complete = report.sections.complete;
		out.push(`## ${label}`, "", `\`${id}\``, "", `Made with \`${made}\`.`, "");
		out.push(
			section(
				"getInfo()",
				Object.entries(uuid.getInfo()).filter(([key]) => key !== "uuid"),
				true
			)
		);
		out.push(
			section("Instance methods", [
				["getVariant()", uuid.getVariant()],
				["getSubvariant()", uuid.getSubvariant()],
				["getVersion()", uuid.getVersion()],
				["version()", uuid.version()],
				["isUUID()", uuid.isUUID()],
				["isCLDMV()", uuid.isCLDMV()],
				["isTimestampVariant()", uuid.isTimestampVariant()],
				["isIssuerVariant()", uuid.isIssuerVariant()],
				["isLegacyTimestampLayout()", uuid.isLegacyTimestampLayout()],
				["getIssuerID()", uuid.getIssuerID()],
				["getIssuerCategory()", uuid.getIssuerCategory()],
				["getTimestamp()", uuid.getTimestamp()],
				["getTimestampBigInt()", uuid.getTimestampBigInt()],
				["getTimestampUnit()", uuid.getTimestampUnit()]
			])
		);
		out.push(
			section("Static methods", [
				["UUID.version(id)", UUID.version(id)],
				["UUID.detectVariant(id)", UUID.detectVariant(id)],
				["UUID.validateRFC(id)", UUID.validateRFC(id)]
			])
		);
		out.push(
			section("await UUID.validate(id)", [
				["isValid", complete.isValid],
				["isUUID", complete.isUUID],
				["isCLDMV", complete.isCLDMV],
				...Object.entries(complete.fields).map(([key, value]) => [`fields.${key}`, value]),
				["errors", complete.errors],
				["warnings", complete.warnings]
			])
		);
		out.push(
			section("await UUID.validateDetailed(id)", [
				["overallValid", report.overallValid],
				...Object.entries(report.sections.bitLayout.bitFields).map(([key, value]) => [`sections.bitLayout.bitFields.${key}`, value]),
				["sections.entropy.entropyBits", report.sections.entropy.entropyBits],
				["sections.entropy.analysis.bitBalance", report.sections.entropy.analysis.bitBalance],
				["allErrors", report.allErrors],
				["allWarnings", report.allWarnings]
			])
		);
	}

	out.push(
		"## `UUID.compare` order",
		"",
		"All the ids above sorted with `UUID.compare`. Ids that hold a timestamp come first, ordered by that time on one scale; equal times fall back to byte order, and ids without a timestamp follow in byte order.",
		""
	);
	const sorted = ids.map((x) => x.id).sort(UUID.compare);
	sorted.forEach((id, i) => {
		const { label } = ids.find((x) => x.id === id);
		const date = new UUID(id).getInfo().date;
		out.push(`${i + 1}. ${label}: ${date ? `\`${date}\`` : "no timestamp"}`);
	});
	out.push("");
	return out.join("\n");
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
	const { UUID } = await import("../src/index.mjs");
	const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
	const target = resolve(root, OUTPUT);
	mkdirSync(dirname(target), { recursive: true });
	writeFileSync(target, await renderUuidDetails(UUID));
	console.log(`Wrote ${OUTPUT}`);
}
