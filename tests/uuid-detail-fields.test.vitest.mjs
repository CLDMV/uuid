/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /tests/uuid-detail-fields.test.vitest.mjs
 *	@Date: 2026-11-24T22:40:00-08:00 (1795588800)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-24T23:30:00-08:00 (1795591800)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * Every detail method describes every UUID, RFC or custom, with the same fields;
 * a field the id's variant doesn't define is null (#123). RFC v1/v6 follow
 * RFC 9562 (#124).
 */

import { describe, expect, test } from "vitest";
import { UUID } from "@cldmv/uuid";
import { BitUtils } from "../src/lib/bit-utils.mjs";

// RFC 9562 appendix A test vectors: 2022-02-22T19:22:22Z, clock sequence 0x33c8, node 9f6bdeced846
const RFC_V1 = "c232ab00-9414-11ec-b3c8-9f6bdeced846";
const RFC_V6 = "1ec9414c-232a-6b00-b3c8-9f6bdeced846";
const RFC_V7 = "017f22e2-79b0-7cc3-98c4-dc0c0c07398f";
const RFC_V4 = "919108f7-52d1-4320-9bac-f847db4148a8";
const RFC_V3 = "5df41881-3aed-3515-88a7-2f4a814cf09e";
const RFC_V5 = "2ed6657d-e927-568b-95e1-2665a8aea6a2";
const RFC_V8 = "2489e9ad-2ee2-8e00-8ec9-32d5f69181c0";
const VECTOR_OPTIONS = { msecs: 1645557742000, nsecs: 0, clockseq: 0x33c8, node: [0x9f, 0x6b, 0xde, 0xce, 0xd8, 0x46] };
const VECTOR_TICKS = 16455577420000000n; // 100-ns since the Unix epoch
const VECTOR_DATE = "2022-02-22T19:22:22.000Z";

const TB_V4 = "8000018b-cfe5-6800-e009-c289f23865d3"; // TB version 4 (ordered layout), 1700000000000 ms
const TA_V1 = "b2a9f880-0000-0000-e003-75f9d411b1d3"; // TA version 1 (legacy layout), 1700000000 s
const MICROSOFT = "00000000-0000-0000-c000-000000000046"; // variant 110 (IUnknown)

const INFO_KEYS = [
	"uuid",
	"isUUID",
	"isCLDMV",
	"variant",
	"variantFamily",
	"subvariant",
	"version",
	"variantIdentifier",
	"issuerID",
	"issuerCategory",
	"timestamp",
	"timestampUnit",
	"date",
	"isIssuerVariant",
	"isTimestampVariant"
];

/** A custom-variant id with a reserved subvariant (10). */
function reservedSubvariant() {
	const bytes = new Uint8Array(16).fill(0x5a);
	BitUtils.setBits(bytes, 64, 3, 0b111);
	BitUtils.setBits(bytes, 67, 2, 0b10);
	BitUtils.setBits(bytes, 75, 4, 1);
	return new UUID(bytes).toString();
}

const ALL_IDS = [
	["RFC v1", RFC_V1],
	["RFC v3", RFC_V3],
	["RFC v4", RFC_V4],
	["RFC v5", RFC_V5],
	["RFC v6", RFC_V6],
	["RFC v7", RFC_V7],
	["RFC v8", RFC_V8],
	["Nil", UUID.NIL],
	["Max", UUID.MAX],
	["Microsoft", MICROSOFT],
	["TA", UUID.TA(1700000000).toString()],
	["TB", UUID.TB(1700000000000).toString()],
	["TA v1", TA_V1],
	["TB v4", TB_V4],
	["IA", UUID.IA(100).toString()],
	["reserved subvariant", reservedSubvariant()]
];

describe("RFC v1 / v6 generation (#124)", () => {
	test("v1 and v6 reproduce the RFC 9562 test vectors", () => {
		expect(UUID.v1(VECTOR_OPTIONS)).toBe(RFC_V1);
		expect(UUID.v6(VECTOR_OPTIONS)).toBe(RFC_V6);
	});

	test.each(["v1", "v6"])("%s keeps every 100-ns interval", (name) => {
		const id = UUID[name]({ ...VECTOR_OPTIONS, nsecs: 1234 });
		expect(new UUID(id).getTimestampBigInt()).toBe(VECTOR_TICKS + 1234n);
	});

	test("v6 ids sort by time across a 2^48 boundary of the tick count", () => {
		// 2^48 100-ns ticks is about 325 days; these straddle one in 2023
		const ids = [1690000000000, 1700000000000, 1710000000000, 1720000000000].map((msecs) => UUID.v6({ ...VECTOR_OPTIONS, msecs }));
		expect([...ids].sort()).toEqual(ids);
	});
});

describe("getInfo() (#123)", () => {
	test.each(ALL_IDS)("%s has every field", (_label, id) => {
		expect(Object.keys(new UUID(id).getInfo())).toEqual(INFO_KEYS);
	});

	test.each([
		[RFC_V1, 5, 1, VECTOR_TICKS, "100ns"],
		[RFC_V6, 5, 6, VECTOR_TICKS, "100ns"],
		[RFC_V7, 4, 7, 1645557742000, "ms"]
	])("RFC id %s reports its version and timestamp", (id, variant, version, timestamp, unit) => {
		expect(new UUID(id).getInfo()).toEqual({
			uuid: id,
			isUUID: true,
			isCLDMV: false,
			variant,
			variantFamily: "RFC 4122/9562",
			subvariant: null,
			version,
			variantIdentifier: version,
			issuerID: null,
			issuerCategory: null,
			timestamp,
			timestampUnit: unit,
			date: VECTOR_DATE,
			isIssuerVariant: false,
			isTimestampVariant: false
		});
	});

	test.each([
		[RFC_V3, 3],
		[RFC_V4, 4],
		[RFC_V5, 5],
		[RFC_V8, 8]
	])("RFC id %s reports version %i and no timestamp", (id, version) => {
		const info = new UUID(id).getInfo();
		expect(info.version).toBe(version);
		expect(info.variantIdentifier).toBe(version);
		expect(info.subvariant).toBe(null);
		expect(info.issuerID).toBe(null);
		expect(info.timestamp).toBe(null);
		expect(info.date).toBe(null);
	});

	test.each([
		[UUID.NIL, 0, 0],
		[UUID.MAX, 7, 15]
	])("%s is the RFC special id, not a custom one", (id, variant, version) => {
		const info = new UUID(id).getInfo();
		expect(info.variantFamily).toBe("RFC 4122/9562");
		expect(info.variant).toBe(variant);
		expect(info.isUUID).toBe(true);
		expect(info.isCLDMV).toBe(false);
		expect(info.version).toBe(version);
		expect(info.variantIdentifier).toBe(version);
		expect(info.subvariant).toBe(null);
		expect(info.issuerID).toBe(null);
	});

	test("a Microsoft id has a family and nothing else", () => {
		const info = new UUID(MICROSOFT).getInfo();
		expect(info.variant).toBe(6);
		expect(info.variantFamily).toBe("Microsoft");
		expect(info.isUUID).toBe(false);
		expect(info.isCLDMV).toBe(false);
		expect(info.version).toBe(null);
		expect(info.variantIdentifier).toBe(null);
	});

	test("Timestamp Variant ids report their timestamp, unit and date", () => {
		expect(new UUID(TB_V4).getInfo()).toEqual({
			uuid: TB_V4,
			isUUID: true,
			isCLDMV: true,
			variant: 7,
			variantFamily: "CLDMV",
			subvariant: 0,
			version: 4,
			variantIdentifier: "TB",
			issuerID: null,
			issuerCategory: null,
			timestamp: 1700000000000,
			timestampUnit: "ms",
			date: "2023-11-14T22:13:20.000Z",
			isIssuerVariant: false,
			isTimestampVariant: true
		});
		const ta = new UUID(TA_V1).getInfo();
		expect(ta.timestamp).toBe(1700000000);
		expect(ta.timestampUnit).toBe("s");
		expect(ta.date).toBe("2023-11-14T22:13:20.000Z");
		expect(UUID.TB(-1700000000000).getInfo().date).toBe("1916-02-18T01:46:40.000Z");
		expect(UUID.TB(2n ** 69n - 1n).getInfo().date).toBe(null);
	});

	test("Issuer Variant ids report their issuer and no timestamp", () => {
		const info = UUID.IA(100).getInfo();
		expect(info.variantFamily).toBe("CLDMV");
		expect(info.subvariant).toBe(1);
		expect(info.issuerID).toBe(100);
		expect(info.issuerCategory).toBe("Category A (Well-Recognized Tech Entities)");
		expect(info.timestamp).toBe(null);
		expect(info.timestampUnit).toBe(null);
	});

	test.each([
		["RFC v1-8", RFC_V4, true, false],
		["Nil", UUID.NIL, true, false],
		["Max", UUID.MAX, true, false],
		["TA", TA_V1, true, true],
		["IA", UUID.IA(100).toString(), true, true],
		["reserved subvariant", reservedSubvariant(), true, true],
		["RFC variant, version 0", "919108f7-52d1-0320-9bac-f847db4148a8", false, false],
		["RFC variant, version 9", "919108f7-52d1-9320-9bac-f847db4148a8", false, false],
		["NCS (not Nil)", "919108f7-52d1-4320-1bac-f847db4148a8", false, false],
		["Microsoft", MICROSOFT, false, false]
	])("%s: isUUID() %s, isCLDMV() %s", (_label, id, isUUID, isCLDMV) => {
		const uuid = new UUID(id);
		expect(uuid.isUUID()).toBe(isUUID);
		expect(uuid.isCLDMV()).toBe(isCLDMV);
		expect(uuid.getInfo().isUUID).toBe(isUUID);
		expect(uuid.getInfo().isCLDMV).toBe(isCLDMV);
	});

	test("the raw getters still read their bit positions", () => {
		const uuid = new UUID(RFC_V4);
		expect(uuid.getVariant()).toBe(BitUtils.getBitsAsNumber(uuid.toBuffer(), 64, 3));
		expect(uuid.getSubvariant()).toBe(BitUtils.getBitsAsNumber(uuid.toBuffer(), 67, 2));
		expect(uuid.getVersion()).toBe(BitUtils.getBitsAsNumber(uuid.toBuffer(), 75, 4));
	});
});

describe("timestamps across RFC and custom ids (#123)", () => {
	test("getTimestamp() / getTimestampUnit() cover RFC v1, v6 and v7", () => {
		expect(new UUID(RFC_V1).getTimestampBigInt()).toBe(VECTOR_TICKS);
		expect(new UUID(RFC_V6).getTimestampUnit()).toBe("100ns");
		expect(new UUID(RFC_V7).getTimestamp()).toBe(1645557742000);
		expect(new UUID(RFC_V7).getTimestampUnit()).toBe("ms");
		expect(new UUID(RFC_V4).getTimestamp()).toBe(null);
		expect(new UUID(RFC_V4).getTimestampUnit()).toBe(null);
	});

	test("UUID.compare orders RFC and custom ids by time on one scale", () => {
		const t = 1700000000000;
		const ids = [
			UUID.TA(t / 1000 - 2).toString(), // 2 s earlier
			UUID.v1({ ...VECTOR_OPTIONS, msecs: t - 1000 }), // 1 s earlier
			UUID.v7({ msecs: t - 1 }),
			UUID.TB(t).toString(),
			UUID.v6({ ...VECTOR_OPTIONS, msecs: t, nsecs: 5 }), // 500 ns later
			UUID.v4(),
			UUID.IA(100).toString()
		];
		const shuffled = [ids[5], ids[3], ids[0], ids[6], ids[4], ids[2], ids[1]];
		const sorted = shuffled.sort(UUID.compare);
		expect(sorted.slice(0, 5)).toEqual(ids.slice(0, 5));
		// ids without a timestamp come last, in byte order
		expect(sorted.slice(5)).toEqual([ids[5], ids[6]].sort());
	});
});

describe("getIssuerID() / getIssuerCategory() (#123)", () => {
	test.each(ALL_IDS.filter(([label]) => label !== "IA"))("%s has no issuer", (_label, id) => {
		const uuid = new UUID(id);
		expect(uuid.getIssuerID()).toBe(null);
		expect(uuid.getIssuerCategory()).toBe(null);
	});

	test.each([
		[0, "Unassigned"],
		[1, "Drafter Reserved"],
		[100, "Category A (Well-Recognized Tech Entities)"],
		[300, "Category B (Open Source Contributors)"],
		[404, "Spec Originator"],
		[700, "Future RFC Expansion"]
	])("issuer %i is %s in getInfo() and the validator alike", async (issuerID, category) => {
		const uuid = UUID.issuer(issuerID, 1);
		expect(uuid.getIssuerCategory()).toBe(category);
		const result = await UUID.validate(uuid);
		expect(result.fields.issuerCategory).toBe(category);
		expect(result.fields).not.toHaveProperty("categoryValidation");
	});

	test("issuer IDs 512-1023 warn about the future RFC range", async () => {
		const result = await UUID.validate(UUID.issuer(700, 1));
		expect(result.warnings).toContain("Issuer ID 700 is in future RFC expansion range");
		const inRange = await UUID.validate(UUID.issuer(300, 1));
		expect(inRange.warnings).toEqual([]);
	});
});

describe("validateDetailed() (#123)", () => {
	test.each(ALL_IDS)("%s gets the same keys in every section", async (_label, id) => {
		const report = await UUID.validateDetailed(id);
		const fields = report.sections.complete.fields;
		expect(Object.keys(fields)).toEqual([
			...INFO_KEYS.filter((key) => key !== "uuid"),
			"timestampLayout",
			"timestampSign",
			"timestampSegmentA",
			"timestampContinuation",
			"timestampMagnitude",
			"isImmutableReserved"
		]);
		expect(Object.keys(report.sections.bitLayout.bitFields)).toEqual([
			"variant",
			"subvariant",
			"version",
			"issuerID",
			"timestampSign",
			"timestampSegmentA",
			"timestampContinuation"
		]);
		expect(Object.keys(report.sections.entropy)).toEqual(["isValid", "entropyBits", "warnings", "analysis"]);
		expect(Object.keys(report.sections.entropy.analysis)).toEqual(["bitBalance"]);
	});

	test.each(ALL_IDS)("%s: validate() fields agree with getInfo()", async (_label, id) => {
		const info = new UUID(id).getInfo();
		const fields = (await UUID.validate(id)).fields;
		for (const key of INFO_KEYS.filter((k) => k !== "uuid")) {
			const value = key === "timestamp" && info.timestamp !== null ? BigInt(info.timestamp) : info[key];
			expect(fields[key]).toEqual(value);
		}
	});

	test("Timestamp Variant: raw fields named after the spec", async () => {
		const fields = (await UUID.validate(TB_V4)).fields;
		expect(fields.timestampLayout).toBe("ordered");
		expect(fields.timestampSign).toBe(1);
		expect(fields.timestampSegmentA).toBe(1700000000000n);
		expect(fields.timestampContinuation).toBe(0);
		expect(fields.timestampMagnitude).toBe(1700000000000n);
		expect(fields).not.toHaveProperty("timestampLower63");
		expect(fields).not.toHaveProperty("reservedBit69");
		expect(fields).not.toHaveProperty("actualTimestamp");
		expect((await UUID.validate(UUID.TA())).fields.timestampLayout).toBe("full");
	});

	test.each([
		[
			"TB",
			TB_V4,
			{ subvariant: 0, version: 4, issuerID: null, timestampSign: 1, timestampSegmentA: 1700000000000n, timestampContinuation: 0 },
			49
		],
		[
			"RFC v4",
			RFC_V4,
			{ subvariant: null, version: 4, issuerID: null, timestampSign: null, timestampSegmentA: null, timestampContinuation: null },
			122
		],
		[
			"RFC v7",
			RFC_V7,
			{ subvariant: null, version: 7, issuerID: null, timestampSign: null, timestampSegmentA: null, timestampContinuation: null },
			74
		],
		[
			"RFC v1",
			RFC_V1,
			{ subvariant: null, version: 1, issuerID: null, timestampSign: null, timestampSegmentA: null, timestampContinuation: null },
			null
		],
		[
			"Nil",
			UUID.NIL,
			{ subvariant: null, version: 0, issuerID: null, timestampSign: null, timestampSegmentA: null, timestampContinuation: null },
			null
		],
		[
			"Max",
			UUID.MAX,
			{ subvariant: null, version: 15, issuerID: null, timestampSign: null, timestampSegmentA: null, timestampContinuation: null },
			null
		],
		[
			"Microsoft",
			MICROSOFT,
			{ subvariant: null, version: null, issuerID: null, timestampSign: null, timestampSegmentA: null, timestampContinuation: null },
			null
		]
	])("%s: bit fields and entropy", async (_label, id, bits, entropyBits) => {
		const report = await UUID.validateDetailed(id);
		expect(report.sections.bitLayout.bitFields).toMatchObject(bits);
		expect(report.sections.entropy.entropyBits).toBe(entropyBits);
		if (entropyBits === null) expect(report.sections.entropy.analysis.bitBalance).toBe(null);
	});

	test("Issuer Variant: issuer bit field, 109 entropy bits", async () => {
		const report = await UUID.validateDetailed(UUID.IA(100));
		expect(report.sections.bitLayout.bitFields).toMatchObject({ subvariant: 1, version: 1, issuerID: 100, timestampSign: null });
		expect(report.sections.entropy.entropyBits).toBe(109);
	});

	test.each(ALL_IDS.filter(([label]) => label !== "reserved subvariant"))("%s: valid, no warnings", async (_label, id) => {
		const report = await UUID.validateDetailed(id);
		expect(report.overallValid).toBe(true);
		expect(report.allErrors).toEqual([]);
		expect(report.sections.complete.warnings).toEqual([]);
		expect(report.sections.bitLayout.errors).toEqual([]);
	});

	test("a reserved subvariant still gets its warning", async () => {
		const report = await UUID.validateDetailed(reservedSubvariant());
		expect(report.allWarnings).toContain("Subvariant 10 is reserved");
		expect(report.sections.entropy.entropyBits).toBe(null);
	});

	test("the entropy balance counts only the entropy bits", async () => {
		const ones = new Uint8Array(16).fill(0xff);
		const report = await UUID.validateDetailed(UUID.TB(0, ones));
		expect(report.sections.entropy.analysis.bitBalance).toBe(1);
		expect(report.sections.entropy.warnings).toContain("All entropy bits are one");
	});
});
