/**
 * Debug script to test timestamp extraction
 */

import { UUID } from "../src/uuid.mjs";
import { BitUtils } from "../src/lib/bit-utils.mjs";

const timestamp = 1766202371199;
console.log("Original timestamp:", timestamp);
console.log("Binary:", timestamp.toString(2));
console.log("Hex:", timestamp.toString(16));

// Create a UUID with this timestamp
const uuid = UUID.TB(timestamp);
console.log("\nUUID:", uuid.toString());

// Extract the timestamp
const extracted = uuid.getTimestamp();
console.log("\nExtracted timestamp:", extracted);
console.log("Match:", extracted === timestamp);

// Debug: manually read the bits
const buffer = uuid.toBuffer();
console.log("\nBuffer hex:", buffer.toString("hex"));

const signBit = BitUtils.getBitsAsNumber(buffer, 0, 1);
console.log("Sign bit (bit 0):", signBit);

const lower32 = BitUtils.getBitsAsNumber(buffer, 1, 32);
console.log("Lower 32 (bits 1-32):", lower32, "hex:", lower32.toString(16));

const middle31 = BitUtils.getBitsAsNumber(buffer, 33, 31);
console.log("Middle 31 (bits 33-63):", middle31, "hex:", middle31.toString(16));

const upper6 = BitUtils.getBitsAsNumber(buffer, 69, 6);
console.log("Upper 6 (bits 69-74):", upper6, "hex:", upper6.toString(16));

// Manually reconstruct
const lower32Big = BigInt(lower32);
const middle31Big = BigInt(middle31);
const upper6Big = BigInt(upper6);

const magnitude = lower32Big | (middle31Big << BigInt(32)) | (upper6Big << BigInt(63));
console.log("\nMagnitude:", magnitude.toString());
console.log("As number:", Number(magnitude));
