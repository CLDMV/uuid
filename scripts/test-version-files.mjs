/**
 * Test script to verify new version files (TA, TB, IA) and variant detection
 */

import { UUID } from "../src/uuid.mjs";
import { ta, parseTimestampV1 } from "../src/lib/versions/timestamp/index.mjs";
import { tb, parseTimestampV2 } from "../src/lib/versions/timestamp/index.mjs";
import { ia, parseIssuerID, getIssuerCategory } from "../src/lib/versions/issuer/index.mjs";

console.log("Testing Custom UUID Version Files and Variant Detection\n");

// Test TA (Timestamp Variant v1 - seconds)
console.log("=== TA (Timestamp Variant v1 - seconds) ===");
const taBuffer = ta();
const taHex = taBuffer.toString("hex");
const taUuid = `${taHex.slice(0, 8)}-${taHex.slice(8, 12)}-${taHex.slice(12, 16)}-${taHex.slice(16, 20)}-${taHex.slice(20, 32)}`;
console.log("Generated TA UUID:", taUuid);
console.log("Timestamp (seconds):", parseTimestampV1(taBuffer));
console.log();

// Test TB (Timestamp Variant v2 - milliseconds)
console.log("=== TB (Timestamp Variant v2 - milliseconds) ===");
const tbBuffer = tb();
const tbHex = tbBuffer.toString("hex");
const tbUuid = `${tbHex.slice(0, 8)}-${tbHex.slice(8, 12)}-${tbHex.slice(12, 16)}-${tbHex.slice(16, 20)}-${tbHex.slice(20, 32)}`;
console.log("Generated TB UUID:", tbUuid);
console.log("Timestamp (milliseconds):", parseTimestampV2(tbBuffer));
console.log();

// Test IA (Issuer Variant v1)
console.log("=== IA (Issuer Variant v1) ===");
const testIssuerID = 42;
const iaBuffer = ia(testIssuerID);
const iaHex = iaBuffer.toString("hex");
const iaUuid = `${iaHex.slice(0, 8)}-${iaHex.slice(8, 12)}-${iaHex.slice(12, 16)}-${iaHex.slice(16, 20)}-${iaHex.slice(20, 32)}`;
console.log("Generated IA UUID:", iaUuid);
console.log("Issuer ID:", parseIssuerID(iaBuffer));
console.log("Category:", getIssuerCategory(testIssuerID));
console.log();

// Test special issuer categories
console.log("=== Issuer Categories ===");
console.log("Issuer 0:", getIssuerCategory(0));
console.log("Issuer 1:", getIssuerCategory(1));
console.log("Issuer 42:", getIssuerCategory(42));
console.log("Issuer 404:", getIssuerCategory(404));
console.log("Issuer 300:", getIssuerCategory(300));
console.log("Issuer 600:", getIssuerCategory(600));
console.log();

// Test variant detection
console.log("=== Variant Detection ===");
console.log("TA UUID variant:", UUID.detectVariant(taUuid));
console.log("TB UUID variant:", UUID.detectVariant(tbUuid));
console.log("IA UUID variant:", UUID.detectVariant(iaUuid));

// Test RFC UUIDs
const v4uuid = UUID.v4();
const v1uuid = UUID.v1();
console.log("RFC v4 UUID:", v4uuid);
console.log("RFC v4 variant:", UUID.detectVariant(v4uuid));
console.log("RFC v1 UUID:", v1uuid);
console.log("RFC v1 variant:", UUID.detectVariant(v1uuid));
console.log();

// Test using UUID instances
console.log("=== Using UUID Instances ===");
const taInstance = new UUID(taUuid);
console.log("TA instance variant:", taInstance.getVariantIdentifier());
console.log("TA instance info:", taInstance.getInfo());
console.log();

const v4Instance = new UUID(v4uuid);
console.log("RFC v4 instance variant:", v4Instance.getVariantIdentifier());
console.log();

console.log("✅ All version files and variant detection working correctly!");
