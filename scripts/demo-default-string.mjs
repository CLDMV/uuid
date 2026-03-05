/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /scripts/demo-default-string.mjs
 *	@Date: 2025-12-22T16:59:18-08:00 (1766451558)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-03-04 21:03:43 -08:00 (1772687023)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Test script to verify UUID returns string by default
 */

import { UUID } from "../src/uuid.mjs";

console.log("Testing UUID default string behavior...\n");

// Test 1: Timestamp Variant
const uuidTA = UUID.TA(Date.now());
console.log("1. Created UUID.TA():");
console.log("   Direct log:", uuidTA);
console.log("   String concat:", "UUID: " + uuidTA);
console.log("   Template literal:", `UUID: ${uuidTA}`);
console.log("   typeof valueOf():", typeof uuidTA.valueOf());
console.log("   valueOf() equals toString():", uuidTA.valueOf() === uuidTA.toString());
console.log("");

// Test 2: Issuer Variant
const uuidIA = UUID.IA(123);
console.log("2. Created UUID.IA(123):");
console.log("   Direct log:", uuidIA);
console.log("   String concat:", "UUID: " + uuidIA);
console.log("   Template literal:", `UUID: ${uuidIA}`);
console.log("");

// Test 3: toBuffer() method
const buffer = uuidTA.toBuffer();
console.log("3. Buffer conversion:");
console.log("   toBuffer() returns Buffer:", Buffer.isBuffer(buffer));
console.log("   Buffer length:", buffer.length);
console.log("");

// Test 4: JSON serialization
const obj = { id: uuidTA, name: "test" };
const json = JSON.stringify(obj);
console.log("4. JSON serialization:");
console.log("   Object:", obj);
console.log("   JSON:", json);
console.log("   Parsed back:", JSON.parse(json));
console.log("");

// Test 5: Equality comparisons
const uuidStr = uuidTA.toString();
console.log("5. Comparisons:");
console.log("   uuid == uuid.toString():", uuidTA == uuidStr);
console.log("   uuid.valueOf() === uuid.toString():", uuidTA.valueOf() === uuidStr);
console.log("");

// Test 6: RFC UUID methods (should already return strings)
const uuidV4 = UUID.v4();
console.log("6. RFC UUID methods:");
console.log("   UUID.v4():", uuidV4);
console.log("   typeof UUID.v4():", typeof uuidV4);
console.log("");

console.log("✓ All tests completed successfully!");
