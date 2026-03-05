/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /tests/default-string-behavior.test.vitest.mjs
 *	@Date: 2025-12-22T16:59:18-08:00 (1766451558)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-03-04 21:04:03 -08:00 (1772687043)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Test suite for UUID default string behavior
 * Verifies that UUIDs automatically convert to strings in all contexts
 */

import { describe, it, expect } from "vitest";
import { UUID } from "../src/uuid.mjs";

describe("UUID Default String Behavior", () => {
	describe("Automatic String Conversion", () => {
		it("should convert to string when logged directly", () => {
			const uuid = UUID.TA();
			const stringified = String(uuid);
			expect(stringified).toBe(uuid.toString());
			expect(stringified).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
		});

		it("should convert to string in template literals", () => {
			const uuid = UUID.TA();
			const template = `UUID: ${uuid}`;
			expect(template).toBe(`UUID: ${uuid.toString()}`);
		});

		it("should convert to string in concatenation", () => {
			const uuid = UUID.IA(123);
			const concat = "UUID: " + uuid;
			expect(concat).toBe("UUID: " + uuid.toString());
		});

		it("should work with String() constructor", () => {
			const uuid = UUID.TB();
			expect(String(uuid)).toBe(uuid.toString());
		});
	});

	describe("valueOf() Method", () => {
		it("should return string from valueOf()", () => {
			const uuid = UUID.TA();
			expect(typeof uuid.valueOf()).toBe("string");
			expect(uuid.valueOf()).toBe(uuid.toString());
		});

		it("should enable loose equality with strings", () => {
			const uuid = UUID.IA(404);
			const str = uuid.toString();
			expect(uuid == str).toBe(true);
		});

		it("should return same value as toString()", () => {
			const uuid = UUID.TB();
			expect(uuid.valueOf()).toBe(uuid.toString());
		});
	});

	describe("Symbol.toPrimitive", () => {
		it("should return string for 'string' hint", () => {
			const uuid = UUID.TA();
			expect(uuid[Symbol.toPrimitive]("string")).toBe(uuid.toString());
		});

		it("should return string for 'default' hint", () => {
			const uuid = UUID.IA(100);
			expect(uuid[Symbol.toPrimitive]("default")).toBe(uuid.toString());
		});

		it("should return string for 'number' hint", () => {
			const uuid = UUID.TB();
			expect(uuid[Symbol.toPrimitive]("number")).toBe(uuid.toString());
		});
	});

	describe("JSON Serialization", () => {
		it("should serialize to string in JSON", () => {
			const uuid = UUID.TA();
			const obj = { id: uuid };
			const json = JSON.stringify(obj);
			expect(json).toBe(`{"id":"${uuid.toString()}"}`);
		});

		it("should serialize nested UUIDs", () => {
			const uuid1 = UUID.IA(0);
			const uuid2 = UUID.TB();
			const obj = {
				primary: uuid1,
				secondary: uuid2,
				nested: { uuid: uuid1 }
			};
			const json = JSON.stringify(obj);
			const parsed = JSON.parse(json);
			expect(parsed.primary).toBe(uuid1.toString());
			expect(parsed.secondary).toBe(uuid2.toString());
			expect(parsed.nested.uuid).toBe(uuid1.toString());
		});

		it("should serialize in arrays", () => {
			const uuids = [UUID.TA(), UUID.TB(), UUID.IA(123)];
			const json = JSON.stringify(uuids);
			const parsed = JSON.parse(json);
			expect(parsed).toEqual(uuids.map((u) => u.toString()));
		});
	});

	describe("toJSON() Method", () => {
		it("should return string from toJSON()", () => {
			const uuid = UUID.TA();
			expect(uuid.toJSON()).toBe(uuid.toString());
			expect(typeof uuid.toJSON()).toBe("string");
		});

		it("should be called during JSON.stringify", () => {
			const uuid = UUID.IA(404);
			const result = JSON.stringify({ id: uuid });
			expect(result).toContain(uuid.toString());
		});
	});

	describe("toBuffer() Method", () => {
		it("should return Buffer when explicitly requested", () => {
			const uuid = UUID.TA();
			const buffer = uuid.toBuffer();
			expect(Buffer.isBuffer(buffer)).toBe(true);
			expect(buffer.length).toBe(16);
		});

		it("should not return buffer by default", () => {
			const uuid = UUID.TB();
			const value = uuid.valueOf();
			expect(Buffer.isBuffer(value)).toBe(false);
			expect(typeof value).toBe("string");
		});

		it("should return independent buffer copy", () => {
			const uuid = UUID.IA(100);
			const buffer1 = uuid.toBuffer();
			const buffer2 = uuid.toBuffer();
			expect(buffer1).not.toBe(buffer2);
			expect(buffer1.equals(buffer2)).toBe(true);
		});
	});

	describe("Consistency Across Variant Types", () => {
		it("should work for Timestamp Variant (TA)", () => {
			const uuid = UUID.TA();
			expect(String(uuid)).toBe(uuid.toString());
			expect(uuid.valueOf()).toBe(uuid.toString());
		});

		it("should work for Timestamp Variant (TB)", () => {
			const uuid = UUID.TB();
			expect(String(uuid)).toBe(uuid.toString());
			expect(uuid.valueOf()).toBe(uuid.toString());
		});

		it("should work for Issuer Variant (IA)", () => {
			const uuid = UUID.IA(0);
			expect(String(uuid)).toBe(uuid.toString());
			expect(uuid.valueOf()).toBe(uuid.toString());
		});

		it("should work for all factory methods", () => {
			const variants = [UUID.TA(), UUID.TB(), UUID.IA(123), UUID.createTimestampVariant(Date.now(), 1), UUID.createIssuerVariant(404, 1)];

			variants.forEach((uuid) => {
				expect(String(uuid)).toBe(uuid.toString());
				expect(uuid.valueOf()).toBe(uuid.toString());
				expect(JSON.stringify({ id: uuid })).toBe(`{"id":"${uuid.toString()}"}`);
			});
		});
	});

	describe("String Format Validation", () => {
		it("should return properly formatted UUID string", () => {
			const uuid = UUID.TA();
			const str = uuid.valueOf();
			expect(str).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
		});

		it("should maintain format consistency across conversions", () => {
			const uuid = UUID.IA(404);
			expect(uuid.toString()).toBe(uuid.valueOf());
			expect(uuid.toString()).toBe(uuid.toJSON());
			expect(uuid.toString()).toBe(String(uuid));
		});
	});

	describe("Node.js Console Inspection", () => {
		it("should have custom inspect symbol", () => {
			const uuid = UUID.TA();
			const inspectSymbol = Symbol.for("nodejs.util.inspect.custom");
			expect(typeof uuid[inspectSymbol]).toBe("function");
		});

		it("should return string for custom inspect", () => {
			const uuid = UUID.TB();
			const inspectSymbol = Symbol.for("nodejs.util.inspect.custom");
			const result = uuid[inspectSymbol]();
			expect(result).toBe(uuid.toString());
			expect(typeof result).toBe("string");
		});
	});

	describe("Comparison Operations", () => {
		it("should support loose equality with string", () => {
			const uuid = UUID.TA();
			const str = uuid.toString();
			expect(uuid == str).toBe(true);
		});

		it("should not support strict equality with string", () => {
			const uuid = UUID.IA(100);
			const str = uuid.toString();
			expect(uuid === str).toBe(false);
		});

		it("should support strict equality with another UUID instance", () => {
			const uuid1 = new UUID();
			const uuid2 = uuid1;
			expect(uuid1 === uuid2).toBe(true);
		});
	});
});
