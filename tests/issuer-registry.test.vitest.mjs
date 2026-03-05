/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /tests/issuer-registry.test.vitest.mjs
 *	@Date: 2026-03-04 20:29:09 -08:00 (1772684949)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-03-04 21:04:03 -08:00 (1772687043)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Issuer Registry Test Suite
 *
 * Covers issuer registration, lookup, import/export, and stats behaviors.
 */

import { describe, it, expect, vi } from "vitest";
import { IssuerRegistry } from "../src/lib/issuer-registry.mjs";
import { ISSUER_CATEGORIES } from "../src/lib/constants.mjs";

describe("IssuerRegistry initialization and lookups", () => {
	it("should initialize with reserved and file-backed issuers", () => {
		const registry = new IssuerRegistry();
		expect(registry.getIssuer(ISSUER_CATEGORIES.UNASSIGNED)?.name).toBe("Unassigned/Open");
		expect(registry.getIssuer(ISSUER_CATEGORIES.DRAFTER_RESERVED)?.name).toBe("Drafter Reserved");
		expect(registry.getIssuer(ISSUER_CATEGORIES.SPEC_ORIGINATOR)?.name).toBe("Specification Originator");
		expect(registry.getIssuer(2)?.category).toBe("Category A");
		expect(registry.getIssuer(256)?.category).toBe("Category B");
	});

	it("should return null for unknown issuer", () => {
		const registry = new IssuerRegistry();
		expect(registry.getIssuer(9999)).toBe(null);
	});
});

describe("IssuerRegistry registration and availability", () => {
	it("should register category A and B issuers", () => {
		const registry = new IssuerRegistry();
		expect(registry.registerCategoryA(3, "A-Org", "Category A org")).toBe(true);
		expect(registry.registerCategoryB(257, "B-Org", "Category B org")).toBe(true);
		expect(registry.getIssuer(3)?.name).toBe("A-Org");
		expect(registry.getIssuer(257)?.name).toBe("B-Org");
	});

	it("should reject duplicate registrations", () => {
		const registry = new IssuerRegistry();
		expect(() => registry.registerCategoryA(2, "Duplicate", "already used")).toThrow(/already registered/);
		expect(() => registry.registerCategoryB(256, "Duplicate", "already used")).toThrow(/already registered/);
	});

	it("should validate category ranges and issuer ID validity", () => {
		const registry = new IssuerRegistry();
		expect(() => registry.registerCategoryA(1, "bad", "bad")).toThrow(/Category A issuer ID/);
		expect(() => registry.registerCategoryB(255, "bad", "bad")).toThrow(/Category B issuer ID/);
		expect(() => registry.isAvailable(-1)).toThrow(/Invalid issuer ID/);
		expect(() => registry.isAvailable(1024)).toThrow(/Invalid issuer ID/);
	});

	it("should correctly report availability and next available IDs", () => {
		const registry = new IssuerRegistry();
		expect(registry.isAvailable(3)).toBe(true);
		expect(registry.isAvailable(2)).toBe(false);
		expect(registry.isAvailable(ISSUER_CATEGORIES.UNASSIGNED)).toBe(false);
		expect(registry.getNextAvailable("A")).toBe(3);
		expect(registry.getNextAvailable("B")).toBe(257);
		expect(() => registry.getNextAvailable("Z")).toThrow(/Invalid category/);
	});

	it("should return null when a category has no available IDs", () => {
		const registry = new IssuerRegistry();
		for (let id = ISSUER_CATEGORIES.CATEGORY_A_START; id <= ISSUER_CATEGORIES.CATEGORY_A_END; id++) {
			if (!registry.getIssuer(id)) {
				registry.registerCategoryA(id, `A-${id}`, "filled");
			}
		}
		expect(registry.getNextAvailable("A")).toBe(null);
	});
});

describe("IssuerRegistry category and reserved block behavior", () => {
	it("should return sorted category lists", () => {
		const registry = new IssuerRegistry();
		registry.registerCategoryA(10, "A10", "a");
		registry.registerCategoryA(8, "A8", "a");
		const categoryAIds = registry.getByCategory("Category A").map((entry) => entry.id);
		expect(categoryAIds[0]).toBe(2);
		expect(categoryAIds).toContain(8);
		expect(categoryAIds).toContain(10);
	});

	it("should enforce minimum block size for future RFC reservations", () => {
		const registry = new IssuerRegistry();
		expect(() => registry.reserveFutureRFCBlock(600, 8, "too small")).toThrow(/at least 16 IDs/);
	});

	it("should reserve block and reject overlapping IDs", () => {
		const registry = new IssuerRegistry();
		ISSUER_CATEGORIES.FUTURE_RFC_START = 512;
		ISSUER_CATEGORIES.FUTURE_RFC_END = 1023;
		expect(registry.reserveFutureRFCBlock(700, 16, "future range")).toBe(true);
		expect(registry.getIssuer(700)?.category).toBe("Future RFC");
		expect(() => registry.reserveFutureRFCBlock(708, 16, "overlap")).toThrow(/already registered/);
	});

	it("should reject out-of-range future RFC reservations", () => {
		const registry = new IssuerRegistry();
		ISSUER_CATEGORIES.FUTURE_RFC_START = 512;
		ISSUER_CATEGORIES.FUTURE_RFC_END = 1023;
		expect(() => registry.reserveFutureRFCBlock(500, 16, "invalid range")).toThrow(/Invalid future RFC range/);
	});
});

describe("IssuerRegistry import, export, and stats", () => {
	it("should export registry data with metadata", () => {
		const registry = new IssuerRegistry();
		const data = registry.export();
		expect(data.version).toBe("1.0");
		expect(data.exportedAt instanceof Date).toBe(true);
		expect(typeof data.registry).toBe("object");
	});

	it("should reject invalid import format", () => {
		const registry = new IssuerRegistry();
		expect(() => registry.import({})).toThrow(/Invalid import data format/);
	});

	it("should import data while preserving immutable reserved IDs", () => {
		const registry = new IssuerRegistry();
		registry.import({
			registry: {
				"0": { name: "Overwritten", category: "Reserved", description: "bad", immutable: false },
				"4": { name: "Imported", category: "Category A", description: "imported", immutable: false, reserved: false }
			}
		});

		expect(registry.getIssuer(0)?.name).toBe("Unassigned/Open");
		expect(registry.getIssuer(4)?.name).toBe("Imported");
	});

	it("should return stats with category counts", () => {
		const registry = new IssuerRegistry();
		ISSUER_CATEGORIES.FUTURE_RFC_START = 512;
		ISSUER_CATEGORIES.FUTURE_RFC_END = 1023;
		registry.registerCategoryA(3, "A-Org", "Category A org");
		registry.reserveFutureRFCBlock(700, 16, "future range");
		const stats = registry.getStats();
		expect(stats.total).toBeGreaterThan(0);
		expect(stats.categoryA).toBeGreaterThan(0);
		expect(stats.categoryB).toBeGreaterThan(0);
		expect(stats.reserved).toBeGreaterThan(0);
		expect(stats.futureRFC).toBeGreaterThan(0);
		expect(stats.available.categoryA).toBeGreaterThanOrEqual(0);
		expect(stats.available.categoryB).toBeGreaterThanOrEqual(0);
		expect(stats.available.futureRFC).toBeGreaterThanOrEqual(0);
	});

	it("should continue initialization when issuer file read fails", async () => {
		vi.resetModules();
		vi.doMock("fs", () => ({
			readFileSync: () => {
				throw new Error("simulated file read failure");
			}
		}));

		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		const { IssuerRegistry: MockedIssuerRegistry } = await import("../src/lib/issuer-registry.mjs");
		const registry = new MockedIssuerRegistry();

		expect(registry.getIssuer(ISSUER_CATEGORIES.UNASSIGNED)?.name).toBe("Unassigned/Open");
		expect(warnSpy).toHaveBeenCalled();

		warnSpy.mockRestore();
		vi.doUnmock("fs");
		vi.resetModules();
	});

	it("should load and reserve future blocks from issuer file data", async () => {
		vi.resetModules();
		ISSUER_CATEGORIES.FUTURE_RFC_START = 512;
		ISSUER_CATEGORIES.FUTURE_RFC_END = 1023;

		vi.doMock("fs", () => ({
			readFileSync: () =>
				JSON.stringify({
					categoryA: { issuers: {} },
					categoryB: { issuers: {} },
					futureRFC: {
						blocks: [{ startID: 512, count: 16, description: "preloaded block" }]
					}
				})
		}));

		const { IssuerRegistry: MockedIssuerRegistry } = await import("../src/lib/issuer-registry.mjs");
		const registry = new MockedIssuerRegistry();
		expect(registry.getIssuer(512)?.category).toBe("Future RFC");

		vi.doUnmock("fs");
		vi.resetModules();
	});

	it("should handle issuer data without categoryB and futureRFC blocks", async () => {
		vi.resetModules();
		vi.doMock("fs", () => ({
			readFileSync: () =>
				JSON.stringify({
					categoryA: {
						issuers: {
							"20": { name: "Only A", description: "single category" }
						}
					}
				})
		}));

		const { IssuerRegistry: MockedIssuerRegistry } = await import("../src/lib/issuer-registry.mjs");
		const registry = new MockedIssuerRegistry();
		expect(registry.getIssuer(20)?.category).toBe("Category A");
		expect(registry.getIssuer(256)).toBe(null);

		vi.doUnmock("fs");
		vi.resetModules();
	});

	it("should use default block description and ignore invalid future block entries", async () => {
		vi.resetModules();
		ISSUER_CATEGORIES.FUTURE_RFC_START = 512;
		ISSUER_CATEGORIES.FUTURE_RFC_END = 1023;

		vi.doMock("fs", () => ({
			readFileSync: () =>
				JSON.stringify({
					futureRFC: {
						blocks: [{ startID: 640, count: 16 }, { startID: 700 }]
					}
				})
		}));

		const { IssuerRegistry: MockedIssuerRegistry } = await import("../src/lib/issuer-registry.mjs");
		const registry = new MockedIssuerRegistry();
		expect(registry.getIssuer(640)?.description).toBe("Reserved block");
		expect(registry.getIssuer(700)).toBe(null);

		vi.doUnmock("fs");
		vi.resetModules();
	});
});
