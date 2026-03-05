/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /tests/rfc-uuids.test.vitest.mjs
 *	@Date: 2025-12-15T20:33:49-08:00 (1765859629)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-03-04 21:04:03 -08:00 (1772687043)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * RFC UUIDs Test Suite
 *
 * Tests for RFC 4122 and RFC 9562 UUID implementations
 */

import { describe, it, expect } from "vitest";
import { UUID } from "../index.mjs";
import * as rfc from "../src/lib/versions/rfc/index.mjs";
import { v1 as rawV1 } from "../src/lib/versions/rfc/v1.mjs";
import { v3 as rawV3 } from "../src/lib/versions/rfc/v35.mjs";
import { v6 as rawV6 } from "../src/lib/versions/rfc/v6.mjs";

describe("RFC UUID Constants", () => {
	it("should expose constants and generators through rfc index module", () => {
		expect(rfc.NIL).toBe(UUID.NIL);
		expect(rfc.MAX).toBe(UUID.MAX);
		expect(rfc.DNS).toBe(UUID.DNS);
		expect(typeof rfc.parse).toBe("function");
		expect(typeof rfc.stringify).toBe("function");
		expect(typeof rfc.validate).toBe("function");
		expect(typeof rfc.version).toBe("function");
		expect(typeof rfc.v1).toBe("function");
		expect(typeof rfc.v3).toBe("function");
		expect(typeof rfc.v4).toBe("function");
		expect(typeof rfc.v5).toBe("function");
		expect(typeof rfc.v6).toBe("function");
		expect(typeof rfc.v7).toBe("function");
		expect(typeof rfc.v8).toBe("function");
	});

	it("should export NIL UUID", () => {
		expect(UUID.NIL).toBe("00000000-0000-0000-0000-000000000000");
	});

	it("should export MAX UUID", () => {
		expect(UUID.MAX).toBe("ffffffff-ffff-ffff-ffff-ffffffffffff");
	});

	it("should export standard namespace UUIDs", () => {
		expect(UUID.DNS).toBe("6ba7b810-9dad-11d1-80b4-00c04fd430c8");
		expect(UUID.URL).toBe("6ba7b811-9dad-11d1-80b4-00c04fd430c8");
		expect(UUID.OID).toBe("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
		expect(UUID.X500).toBe("6ba7b814-9dad-11d1-80b4-00c04fd430c8");
	});
});

describe("Direct RFC generator branch coverage", () => {
	it("should exercise v1 with explicit nsecs and buffer output", () => {
		const buf = new Uint8Array(32);
		const result = rawV1({ msecs: Date.now(), nsecs: 321, buf, offset: 8 });
		expect(result).toBe(buf);
		expect(UUID.version(UUID.stringify(buf.slice(8, 24)))).toBe(1);
	});

	it("should exercise v3 internal return-buffer branch", () => {
		const buf = new Uint8Array(32);
		const result = rawV3("hello", UUID.DNS, buf, 4);
		expect(result).toBe(buf);
		expect(UUID.version(UUID.stringify(buf.slice(4, 20)))).toBe(3);
	});

	it("should exercise v6 with explicit options and buffer output", () => {
		const buf = new Uint8Array(32);
		const result = rawV6({ msecs: Date.now(), nsecs: 7, clockseq: 0x1234, node: [1, 2, 3, 4, 5, 6], buf, offset: 6 });
		expect(result).toBe(buf);
		expect(UUID.version(UUID.stringify(buf.slice(6, 22)))).toBe(6);
	});
});

describe("parse()", () => {
	it("should parse valid UUID string to bytes", () => {
		const uuid = "6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b";
		const bytes = UUID.parse(uuid);

		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(bytes.length).toBe(16);
		expect(bytes[0]).toBe(0x6e);
		expect(bytes[1]).toBe(0xc0);
		expect(bytes[15]).toBe(0x0b);
	});

	it("should parse UUID string without dashes", () => {
		const uuid = "6ec0bd7f11c043da975e2a8ad9ebae0b";
		const bytes = UUID.parse(uuid);

		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(bytes.length).toBe(16);
	});

	it("should parse NIL UUID", () => {
		const bytes = UUID.parse(UUID.NIL);

		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(bytes.every((b) => b === 0)).toBe(true);
	});

	it("should parse MAX UUID", () => {
		const bytes = UUID.parse(UUID.MAX);

		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(bytes.every((b) => b === 0xff)).toBe(true);
	});

	it("should throw on non-string input", () => {
		expect(() => UUID.parse(123)).toThrow(TypeError);
		expect(() => UUID.parse(null)).toThrow(TypeError);
		expect(() => UUID.parse(undefined)).toThrow(TypeError);
	});

	it("should throw on invalid length", () => {
		expect(() => UUID.parse("too-short")).toThrow(TypeError);
		expect(() => UUID.parse("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b-extra")).toThrow(TypeError);
	});

	it("should throw on invalid characters", () => {
		expect(() => UUID.parse("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0g")).toThrow(TypeError);
		expect(() => UUID.parse("zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz")).toThrow(TypeError);
	});
});

describe("stringify()", () => {
	it("should convert bytes to UUID string", () => {
		const bytes = new Uint8Array([0x6e, 0xc0, 0xbd, 0x7f, 0x11, 0xc0, 0x43, 0xda, 0x97, 0x5e, 0x2a, 0x8a, 0xd9, 0xeb, 0xae, 0x0b]);
		const uuid = UUID.stringify(bytes);

		expect(uuid).toBe("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b");
	});

	it("should handle NIL bytes", () => {
		const bytes = new Uint8Array(16);
		const uuid = UUID.stringify(bytes);

		expect(uuid).toBe(UUID.NIL);
	});

	it("should handle MAX bytes", () => {
		const bytes = new Uint8Array(16).fill(0xff);
		const uuid = UUID.stringify(bytes);

		expect(uuid).toBe(UUID.MAX);
	});

	it("should handle Buffer input", () => {
		const bytes = Buffer.from([0x6e, 0xc0, 0xbd, 0x7f, 0x11, 0xc0, 0x43, 0xda, 0x97, 0x5e, 0x2a, 0x8a, 0xd9, 0xeb, 0xae, 0x0b]);
		const uuid = UUID.stringify(bytes);

		expect(uuid).toBe("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b");
	});

	it("should handle Array input", () => {
		const bytes = [0x6e, 0xc0, 0xbd, 0x7f, 0x11, 0xc0, 0x43, 0xda, 0x97, 0x5e, 0x2a, 0x8a, 0xd9, 0xeb, 0xae, 0x0b];
		const uuid = UUID.stringify(bytes);

		expect(uuid).toBe("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b");
	});

	it("should throw on invalid length", () => {
		expect(() => UUID.stringify(new Uint8Array(8))).toThrow(TypeError);
		expect(() => UUID.stringify(new Uint8Array(32))).toThrow(TypeError);
	});

	it("should throw on null or undefined", () => {
		expect(() => UUID.stringify(null)).toThrow(TypeError);
		expect(() => UUID.stringify(undefined)).toThrow(TypeError);
	});
});

describe("parse() and stringify() round-trip", () => {
	it("should round-trip correctly", () => {
		const original = "6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b";
		const bytes = UUID.parse(original);
		const result = UUID.stringify(bytes);

		expect(result).toBe(original);
	});

	it("should round-trip NIL", () => {
		const bytes = UUID.parse(UUID.NIL);
		const result = UUID.stringify(bytes);

		expect(result).toBe(UUID.NIL);
	});

	it("should round-trip MAX", () => {
		const bytes = UUID.parse(UUID.MAX);
		const result = UUID.stringify(bytes);

		expect(result).toBe(UUID.MAX);
	});
});

describe("validate()", () => {
	it("should validate correct UUID strings", () => {
		expect(UUID.validateRFC("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b")).toBe(true);
		expect(UUID.validateRFC(UUID.NIL)).toBe(true);
		expect(UUID.validateRFC(UUID.MAX)).toBe(true);
	});

	it("should validate all standard UUID versions", () => {
		expect(UUID.validateRFC("6ec0bd7f-11c0-13da-975e-2a8ad9ebae0b")).toBe(true); // v1
		expect(UUID.validateRFC("6ec0bd7f-11c0-23da-975e-2a8ad9ebae0b")).toBe(true); // v2
		expect(UUID.validateRFC("6ec0bd7f-11c0-33da-975e-2a8ad9ebae0b")).toBe(true); // v3
		expect(UUID.validateRFC("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b")).toBe(true); // v4
		expect(UUID.validateRFC("6ec0bd7f-11c0-53da-975e-2a8ad9ebae0b")).toBe(true); // v5
		expect(UUID.validateRFC("6ec0bd7f-11c0-63da-975e-2a8ad9ebae0b")).toBe(true); // v6
		expect(UUID.validateRFC("6ec0bd7f-11c0-73da-975e-2a8ad9ebae0b")).toBe(true); // v7
		expect(UUID.validateRFC("6ec0bd7f-11c0-83da-975e-2a8ad9ebae0b")).toBe(true); // v8
	});

	it("should validate variant bits", () => {
		expect(UUID.validateRFC("6ec0bd7f-11c0-43da-875e-2a8ad9ebae0b")).toBe(true); // variant 10
		expect(UUID.validateRFC("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b")).toBe(true); // variant 10
		expect(UUID.validateRFC("6ec0bd7f-11c0-43da-a75e-2a8ad9ebae0b")).toBe(true); // variant 10
		expect(UUID.validateRFC("6ec0bd7f-11c0-43da-b75e-2a8ad9ebae0b")).toBe(true); // variant 10
	});

	it("should reject invalid UUID strings", () => {
		expect(UUID.validateRFC("not-a-uuid")).toBe(false);
		expect(UUID.validateRFC("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0")).toBe(false); // too short
		expect(UUID.validateRFC("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0bb")).toBe(false); // too long
		expect(UUID.validateRFC("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0g")).toBe(false); // invalid char
	});

	it("should reject UUID without dashes", () => {
		expect(UUID.validateRFC("6ec0bd7f11c043da975e2a8ad9ebae0b")).toBe(false);
	});

	it("should reject non-string input", () => {
		expect(UUID.validateRFC(123)).toBe(false);
		expect(UUID.validateRFC(null)).toBe(false);
		expect(UUID.validateRFC(undefined)).toBe(false);
		expect(UUID.validateRFC({})).toBe(false);
	});

	it("should reject invalid version numbers", () => {
		expect(UUID.validateRFC("6ec0bd7f-11c0-03da-975e-2a8ad9ebae0b")).toBe(false); // v0
		expect(UUID.validateRFC("6ec0bd7f-11c0-93da-975e-2a8ad9ebae0b")).toBe(false); // v9
		expect(UUID.validateRFC("6ec0bd7f-11c0-f3da-975e-2a8ad9ebae0b")).toBe(false); // vF
	});

	it("should reject invalid variant bits", () => {
		expect(UUID.validateRFC("6ec0bd7f-11c0-43da-075e-2a8ad9ebae0b")).toBe(false); // variant 00
		expect(UUID.validateRFC("6ec0bd7f-11c0-43da-475e-2a8ad9ebae0b")).toBe(false); // variant 01
		expect(UUID.validateRFC("6ec0bd7f-11c0-43da-c75e-2a8ad9ebae0b")).toBe(false); // variant 110
	});
});

describe("version()", () => {
	it("should detect version from UUID string", () => {
		expect(UUID.version("6ec0bd7f-11c0-13da-975e-2a8ad9ebae0b")).toBe(1);
		expect(UUID.version("6ec0bd7f-11c0-23da-975e-2a8ad9ebae0b")).toBe(2);
		expect(UUID.version("6ec0bd7f-11c0-33da-975e-2a8ad9ebae0b")).toBe(3);
		expect(UUID.version("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b")).toBe(4);
		expect(UUID.version("6ec0bd7f-11c0-53da-975e-2a8ad9ebae0b")).toBe(5);
		expect(UUID.version("6ec0bd7f-11c0-63da-975e-2a8ad9ebae0b")).toBe(6);
		expect(UUID.version("6ec0bd7f-11c0-73da-975e-2a8ad9ebae0b")).toBe(7);
		expect(UUID.version("6ec0bd7f-11c0-83da-975e-2a8ad9ebae0b")).toBe(8);
	});

	it("should return null for invalid UUID", () => {
		expect(UUID.version("not-a-uuid")).toBe(null);
		expect(UUID.version("6ec0bd7f-11c0-03da-975e-2a8ad9ebae0b")).toBe(null); // v0
		expect(UUID.version("6ec0bd7f-11c0-93da-975e-2a8ad9ebae0b")).toBe(null); // v9
	});
});

describe("v1()", () => {
	it("should generate valid v1 UUID", () => {
		const uuid = UUID.v1();

		expect(typeof uuid).toBe("string");
		expect(UUID.validateRFC(uuid)).toBe(true);
		expect(UUID.version(uuid)).toBe(1);
	});

	it("should generate unique v1 UUIDs", () => {
		const uuid1 = UUID.v1();
		const uuid2 = UUID.v1();

		expect(uuid1).not.toBe(uuid2);
	});

	it("should accept custom timestamp", () => {
		const msecs = Date.now();
		const uuid = UUID.v1({ msecs });

		expect(UUID.validateRFC(uuid)).toBe(true);
		expect(UUID.version(uuid)).toBe(1);
	});

	it("should accept custom clockseq", () => {
		const uuid = UUID.v1({ clockseq: 0x1234 });

		expect(UUID.validateRFC(uuid)).toBe(true);
		expect(UUID.version(uuid)).toBe(1);
	});

	it("should accept custom node", () => {
		const node = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06];
		const uuid = UUID.v1({ node });

		expect(UUID.validateRFC(uuid)).toBe(true);
		expect(UUID.version(uuid)).toBe(1);
		expect(uuid.endsWith("010203040506")).toBe(true);
	});

	it("should write to provided buffer", () => {
		const buf = new Uint8Array(16);
		const result = UUID.v1({ buf });

		expect(result).toBe(buf);
		expect(UUID.version(UUID.stringify(buf))).toBe(1);
	});
});

describe("v3()", () => {
	it("should generate valid v3 UUID", () => {
		const uuid = UUID.v3("hello", UUID.DNS);

		expect(typeof uuid).toBe("string");
		expect(UUID.validateRFC(uuid)).toBe(true);
		expect(UUID.version(uuid)).toBe(3);
	});

	it("should generate deterministic v3 UUIDs", () => {
		const uuid1 = UUID.v3("hello", UUID.DNS);
		const uuid2 = UUID.v3("hello", UUID.DNS);

		expect(uuid1).toBe(uuid2);
	});

	it("should generate different UUIDs for different names", () => {
		const uuid1 = UUID.v3("hello", UUID.DNS);
		const uuid2 = UUID.v3("world", UUID.DNS);

		expect(uuid1).not.toBe(uuid2);
	});

	it("should generate different UUIDs for different namespaces", () => {
		const uuid1 = UUID.v3("hello", UUID.DNS);
		const uuid2 = UUID.v3("hello", UUID.URL);

		expect(uuid1).not.toBe(uuid2);
	});

	it("should accept namespace as bytes", () => {
		const namespace = UUID.parse(UUID.DNS);
		const uuid = UUID.v3("hello", namespace);

		expect(UUID.validateRFC(uuid)).toBe(true);
		expect(UUID.version(uuid)).toBe(3);
	});

	it("should work with all standard namespaces", () => {
		const dns = UUID.v3("example.com", UUID.DNS);
		const url = UUID.v3("http://example.com", UUID.URL);
		const oid = UUID.v3("1.2.3.4", UUID.OID);
		const x500 = UUID.v3("CN=Example", UUID.X500);

		expect(UUID.version(dns)).toBe(3);
		expect(UUID.version(url)).toBe(3);
		expect(UUID.version(oid)).toBe(3);
		expect(UUID.version(x500)).toBe(3);
	});
});

describe("v4()", () => {
	it("should generate valid v4 UUID", () => {
		const uuid = UUID.v4();

		expect(typeof uuid).toBe("string");
		expect(UUID.validateRFC(uuid)).toBe(true);
		expect(UUID.version(uuid)).toBe(4);
	});

	it("should generate unique v4 UUIDs", () => {
		const uuid1 = UUID.v4();
		const uuid2 = UUID.v4();

		expect(uuid1).not.toBe(uuid2);
	});

	it("should accept custom random bytes", () => {
		const random = new Uint8Array(16).fill(0xaa);
		const uuid = UUID.v4({ random });

		expect(UUID.validateRFC(uuid)).toBe(true);
		expect(UUID.version(uuid)).toBe(4);
	});

	it("should write to provided buffer", () => {
		const buf = new Uint8Array(16);
		const result = UUID.v4({ buf });

		expect(result).toBe(buf);
		expect(UUID.version(UUID.stringify(buf))).toBe(4);
	});

	it("should generate UUIDs with proper randomness distribution", () => {
		const uuids = new Set();
		for (let i = 0; i < 1000; i++) {
			uuids.add(UUID.v4());
		}

		expect(uuids.size).toBe(1000); // All unique
	});
});

describe("v5()", () => {
	it("should generate valid v5 UUID", () => {
		const uuid = UUID.v5("hello", UUID.DNS);

		expect(typeof uuid).toBe("string");
		expect(UUID.validateRFC(uuid)).toBe(true);
		expect(UUID.version(uuid)).toBe(5);
	});

	it("should generate deterministic v5 UUIDs", () => {
		const uuid1 = UUID.v5("hello", UUID.DNS);
		const uuid2 = UUID.v5("hello", UUID.DNS);

		expect(uuid1).toBe(uuid2);
	});

	it("should generate different UUIDs for different names", () => {
		const uuid1 = UUID.v5("hello", UUID.DNS);
		const uuid2 = UUID.v5("world", UUID.DNS);

		expect(uuid1).not.toBe(uuid2);
	});

	it("should generate different UUIDs for different namespaces", () => {
		const uuid1 = UUID.v5("hello", UUID.DNS);
		const uuid2 = UUID.v5("hello", UUID.URL);

		expect(uuid1).not.toBe(uuid2);
	});

	it("should accept namespace as bytes", () => {
		const namespace = UUID.parse(UUID.DNS);
		const uuid = UUID.v5("hello", namespace);

		expect(UUID.validateRFC(uuid)).toBe(true);
		expect(UUID.version(uuid)).toBe(5);
	});

	it("should generate different UUIDs than v3 with same inputs", () => {
		const v3uuid = UUID.v3("hello", UUID.DNS);
		const v5uuid = UUID.v5("hello", UUID.DNS);

		expect(v3uuid).not.toBe(v5uuid);
	});
});

describe("v6()", () => {
	it("should generate valid v6 UUID", () => {
		const uuid = UUID.v6();

		expect(typeof uuid).toBe("string");
		expect(UUID.validateRFC(uuid)).toBe(true);
		expect(UUID.version(uuid)).toBe(6);
	});

	it("should generate unique v6 UUIDs", () => {
		const uuid1 = UUID.v6();
		const uuid2 = UUID.v6();

		expect(uuid1).not.toBe(uuid2);
	});

	it("should accept custom timestamp", () => {
		const msecs = Date.now();
		const uuid = UUID.v6({ msecs });

		expect(UUID.validateRFC(uuid)).toBe(true);
		expect(UUID.version(uuid)).toBe(6);
	});

	it("should be sortable (monotonic)", () => {
		const uuid1 = UUID.v6({ msecs: Date.now() });
		const uuid2 = UUID.v6({ msecs: Date.now() + 1000 });

		expect(uuid1.localeCompare(uuid2)).toBeLessThan(0);
	});
});

describe("v7()", () => {
	it("should generate valid v7 UUID", () => {
		const uuid = UUID.v7();

		expect(typeof uuid).toBe("string");
		expect(UUID.validateRFC(uuid)).toBe(true);
		expect(UUID.version(uuid)).toBe(7);
	});

	it("should generate unique v7 UUIDs", () => {
		const uuid1 = UUID.v7();
		const uuid2 = UUID.v7();

		expect(uuid1).not.toBe(uuid2);
	});

	it("should accept custom timestamp", () => {
		const msecs = Date.now();
		const uuid = UUID.v7({ msecs });

		expect(UUID.validateRFC(uuid)).toBe(true);
		expect(UUID.version(uuid)).toBe(7);
	});

	it("should be sortable (monotonic)", () => {
		const uuid1 = UUID.v7({ msecs: Date.now() });
		const uuid2 = UUID.v7({ msecs: Date.now() + 1000 });

		expect(uuid1.localeCompare(uuid2)).toBeLessThan(0);
	});

	it("should embed timestamp in first 48 bits", () => {
		const msecs = 1609459200000; // 2021-01-01 00:00:00 UTC
		const uuid = UUID.v7({ msecs });
		const bytes = UUID.parse(uuid);

		// Extract timestamp from first 48 bits
		const extracted =
			bytes[0] * 0x10000000000 + bytes[1] * 0x100000000 + bytes[2] * 0x1000000 + bytes[3] * 0x10000 + bytes[4] * 0x100 + bytes[5];

		expect(extracted).toBe(msecs);
	});

	it("should write to provided buffer", () => {
		const buf = new Uint8Array(16);
		const result = UUID.v7({ buf });

		expect(result).toBe(buf);
		expect(UUID.version(UUID.stringify(buf))).toBe(7);
	});
});

describe("v8()", () => {
	it("should generate valid v8 UUID string with correct bits", () => {
		const uuid = UUID.v8();

		expect(typeof uuid).toBe("string");
		expect(UUID.validateRFC(uuid)).toBe(true);
		expect(UUID.version(uuid)).toBe(8);
	});

	it("should use provided custom data while enforcing version and variant bits", () => {
		const data = new Uint8Array(16).fill(0x00);
		const uuid = UUID.v8({ data });
		const bytes = UUID.parse(uuid);

		expect(bytes[6] >> 4).toBe(8);
		expect((bytes[8] & 0xc0) >> 6).toBe(2);
		expect(bytes[0]).toBe(0x00);
		expect(bytes[15]).toBe(0x00);
	});

	it("should write into provided buffer at offset and return buffer", () => {
		const data = new Uint8Array(16);
		for (let i = 0; i < 16; i++) {
			data[i] = i;
		}

		const buf = new Uint8Array(32).fill(0xff);
		const result = UUID.v8({ data, buf, offset: 8 });

		expect(result).toBe(buf);
		expect(buf[0]).toBe(0xff);
		expect(buf[7]).toBe(0xff);
		expect(buf[24]).toBe(0xff);
		expect(buf[23]).toBe(15);
		expect(buf[14] >> 4).toBe(8);
		expect((buf[16] & 0xc0) >> 6).toBe(2);
	});
});

describe("Version Comparison", () => {
	it("should generate different versions with different characteristics", () => {
		const v1uuid = UUID.v1();
		const v3uuid = UUID.v3("test", UUID.DNS);
		const v4uuid = UUID.v4();
		const v5uuid = UUID.v5("test", UUID.DNS);
		const v6uuid = UUID.v6();
		const v7uuid = UUID.v7();

		// All should be valid
		expect(UUID.validateRFC(v1uuid)).toBe(true);
		expect(UUID.validateRFC(v3uuid)).toBe(true);
		expect(UUID.validateRFC(v4uuid)).toBe(true);
		expect(UUID.validateRFC(v5uuid)).toBe(true);
		expect(UUID.validateRFC(v6uuid)).toBe(true);
		expect(UUID.validateRFC(v7uuid)).toBe(true);

		// All should have correct versions
		expect(UUID.version(v1uuid)).toBe(1);
		expect(UUID.version(v3uuid)).toBe(3);
		expect(UUID.version(v4uuid)).toBe(4);
		expect(UUID.version(v5uuid)).toBe(5);
		expect(UUID.version(v6uuid)).toBe(6);
		expect(UUID.version(v7uuid)).toBe(7);

		// All should be unique
		const allUuids = [v1uuid, v3uuid, v4uuid, v5uuid, v6uuid, v7uuid];
		const uniqueUuids = new Set(allUuids);
		expect(uniqueUuids.size).toBe(6);
	});
});
