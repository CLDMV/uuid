import { UUID } from "../src/uuid.mjs";

const timestamp = 1766202473379;
console.log("Input timestamp:", timestamp);

// Create UUID without any custom entropy
const uuid = UUID.TB(timestamp);
const extracted = uuid.getTimestamp();

console.log("Extracted:", extracted);
console.log("Match:", extracted === timestamp);
console.log("Difference:", extracted - timestamp);
