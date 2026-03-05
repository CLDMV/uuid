/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /tests/uuid-coverage.test.vitest.mjs
 *	@Date: 2026-03-04 20:33:19 -08:00 (1772685199)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-03-04 21:04:03 -08:00 (1772687043)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * UUID Coverage-Oriented Test Suite
 *
 * Targets alias methods and branch paths that are not exercised by primary behavior suites.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { UUID } from "../src/uuid.mjs";
import { BitUtils } from "../src/lib/bit-utils.mjs";

describe("UUID branch and alias coverage", () => {
	beforeEach(() => {
		UUID._registryInstance = undefined;
	});

	it("should throw for unsupported constructor input type", () => {
		expect(() => new UUID({ not: "supported" })).toThrow(/Invalid UUID data type/);
	});

	it("should accept Date input for timestamp version 2", () => {
		const date = new Date("2024-01-01T00:00:00.000Z");
		const uuid = UUID.createTimestampVariant(date, 2);
		expect(uuid.isTimestampVariant()).toBe(true);
		expect(uuid.getVersion()).toBe(2);
	});

	it("should use provided entropy for timestamp variant without random fallback", () => {
		const entropy = Buffer.alloc(16, 0xaa);
		const uuid = UUID.createTimestampVariant(Date.now(), 2, entropy);
		expect(uuid.isTimestampVariant()).toBe(true);
		expect(uuid.getVersion()).toBe(2);
	});

	it("should use issuer and timestamp alias constructors", () => {
		const issuerUuid = UUID.issuer(100, 2);
		const timestampUuid = UUID.timestamp(Date.now(), 2);
		expect(issuerUuid.isIssuerVariant()).toBe(true);
		expect(timestampUuid.isTimestampVariant()).toBe(true);
	});

	it("should return dynamic custom version labels", () => {
		const timestampV3 = UUID.createTimestampVariant(Date.now(), 3);
		const issuerV2 = UUID.createIssuerVariant(100, 2);
		expect(timestampV3.version()).toBe("Timestamp v3");
		expect(issuerV2.version()).toBe("Issuer v2");
	});

	it("should return reserved labels for reserved subvariants", () => {
		const base = UUID.createIssuerVariant(100, 1);
		const buffer = base.toBuffer();
		BitUtils.setBits(buffer, 67, 2, 0b10);
		const reserved10 = new UUID(buffer);
		expect(reserved10.version()).toBe("Reserved (subvariant 2)");

		BitUtils.setBits(buffer, 67, 2, 0b11);
		const reserved11 = new UUID(buffer);
		expect(reserved11.version()).toBe("Reserved (subvariant 3)");
	});

	it("should return null for unknown custom subvariant and unknown issuer category branches", () => {
		const uuid = UUID.createIssuerVariant(100, 1);
		const subvariantSpy = vi.spyOn(uuid, "getSubvariant").mockReturnValue(99);
		expect(uuid.version()).toBe(null);
		subvariantSpy.mockRestore();

		const issuerSpy = vi.spyOn(uuid, "getIssuerID").mockReturnValue(-1);
		expect(uuid.getIssuerCategory()).toBe("Unknown");
		issuerSpy.mockRestore();
	});

	it("should expose legacy and metadata helpers", () => {
		const uuid = UUID.createIssuerVariant(404, 1);
		expect(uuid.getVariantIdentifier()).toBe("IA");
		expect(uuid.toJSON()).toBe(uuid.toString());
		expect(uuid.valueOf()).toBe(uuid.toString());
		expect(uuid[Symbol.toPrimitive]("string")).toBe(uuid.toString());
		expect(uuid[Symbol.for("nodejs.util.inspect.custom")]()).toBe(uuid.toString());

		const info = uuid.getInfo();
		expect(info.variantIdentifier).toBe("IA");
	});

	it("should exercise static async registry and validator helpers", async () => {
		const registry1 = await UUID.getRegistry();
		const registry2 = await UUID.getRegistry();
		expect(registry1).toBe(registry2);

		expect(await UUID.registerIssuerA(3, "A3", "category A entry")).toBe(true);
		expect(await UUID.registerIssuerB(257, "B257", "category B entry")).toBe(true);
		expect((await UUID.getIssuerInfo(3))?.name).toBe("A3");

		const sample = UUID.createIssuerVariant(100, 1).toBuffer();
		const validateResult = await UUID.validate(sample);
		const detailedResult = await UUID.validateDetailed(sample);
		expect(validateResult.isValid).toBe(true);
		expect(detailedResult.overallValid).toBe(true);
	});

	it("should exercise RFC wrapper static methods", () => {
		const v1 = UUID.v1();
		const v3 = UUID.v3("hello", UUID.DNS);
		const v4 = UUID.v4();
		const v5 = UUID.v5("hello", UUID.DNS);
		const v6 = UUID.v6();
		const v7 = UUID.v7();
		const v8 = UUID.v8();

		expect(UUID.validateRFC(v1)).toBe(true);
		expect(UUID.validateRFC(v3)).toBe(true);
		expect(UUID.validateRFC(v4)).toBe(true);
		expect(UUID.validateRFC(v5)).toBe(true);
		expect(UUID.validateRFC(v6)).toBe(true);
		expect(UUID.validateRFC(v7)).toBe(true);
		expect(UUID.validateRFC(v8)).toBe(true);

		const bytes = UUID.parse(v4);
		expect(UUID.stringify(bytes)).toBe(v4);
	});

	it("should handle static version and detectVariant fallback branches", () => {
		const instance = UUID.createIssuerVariant(100, 1);
		expect(UUID.version(instance)).toBe("IA");

		expect(UUID.version("not-a-uuid")).toBe(null);
		expect(UUID.version({ nope: true })).toBe(null);
		expect(UUID.detectVariant(instance)).toBe("IA");
	});

	it("should execute devcheck branches for CI and valid dev environment", async () => {
		const originalCI = process.env.CI;
		const originalNodeEnv = process.env.NODE_ENV;
		const originalNodeOptions = process.env.NODE_OPTIONS;

		try {
			process.env.CI = "1";
			process.env.NODE_ENV = "production";
			process.env.NODE_OPTIONS = "";
			await import("../devcheck.mjs?ci-case");

			process.env.CI = "";
			process.env.NODE_ENV = "development";
			process.env.NODE_OPTIONS = "";
			await import("../devcheck.mjs?dev-case");
		} finally {
			process.env.CI = originalCI;
			process.env.NODE_ENV = originalNodeEnv;
			process.env.NODE_OPTIONS = originalNodeOptions;
		}
	});
});
