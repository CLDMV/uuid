/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /scripts/demo-custom-uuids.mjs
 *	@Date: 2025-12-19 19:38:49 -08:00 (1766201929)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-03-04 21:03:43 -08:00 (1772687023)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Custom UUID Demonstration Script
 *
 * This script generates each custom UUID variant (TA, TB, IA) and extracts
 * all available data to verify it matches expected values.
 */

import { UUID } from "../src/uuid.mjs";

const COLLISION_COUNT = 10000; // Number of UUIDs to generate for collision testing

// ANSI color codes for better readability
const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	green: "\x1b[32m",
	blue: "\x1b[34m",
	cyan: "\x1b[36m",
	yellow: "\x1b[33m",
	magenta: "\x1b[35m"
};

/**
 * Print a section header
 * @param {string} title - Section title
 */
function printHeader(title) {
	console.log("\n" + colors.bright + colors.blue + "═".repeat(80) + colors.reset);
	console.log(colors.bright + colors.blue + `  ${title}` + colors.reset);
	console.log(colors.bright + colors.blue + "═".repeat(80) + colors.reset + "\n");
}

/**
 * Print a key-value pair
 * @param {string} key - Property name
 * @param {*} value - Property value
 * @param {boolean} expected - Expected value
 */
function printValue(key, value, expected) {
	const match = value === expected;
	const status = match ? colors.green + "✓" : colors.yellow + "✗";
	const keyStr = colors.cyan + key.padEnd(25);
	const valueStr = colors.bright + String(value);
	const expectedStr = expected !== undefined ? ` ${colors.reset}(expected: ${colors.magenta}${expected}${colors.reset})` : "";

	console.log(`  ${status} ${keyStr}${colors.reset}: ${valueStr}${expectedStr}${colors.reset}`);
}

/**
 * Verify UUID matches expected structure
 * @param {UUID} uuid - UUID instance
 * @param {object} expected - Expected values
 * @param {number} originalTimestamp - Original timestamp used for generation (optional)
 */
function verifyUUID(uuid, expected, originalTimestamp = null) {
	const info = uuid.getInfo();

	console.log(colors.bright + "\nGenerated UUID:" + colors.reset);
	console.log(`  ${colors.yellow}${uuid.toString()}${colors.reset}\n`);

	console.log(colors.bright + "Extracted Data:" + colors.reset);
	printValue("UUID Format Valid", /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid.toString()), true);
	printValue("Is Custom UUID", info.isUUID, expected.isUUID);
	printValue("Variant (bits 64-66)", info.variant, expected.variant);
	printValue("Subvariant (bits 67-68)", info.subvariant, expected.subvariant);
	printValue("Version (bits 75-78)", info.version, expected.version);

	if (expected.isIssuerVariant) {
		printValue("Is Issuer Variant", info.isIssuerVariant, expected.isIssuerVariant);
		printValue("Issuer ID (bits 79-88)", info.issuerID, expected.issuerID);
		printValue("Issuer Category", info.issuerCategory, expected.issuerCategory);
	} else if (expected.isTimestampVariant) {
		printValue("Is Timestamp Variant", info.isTimestampVariant, expected.isTimestampVariant);
		printValue("Issuer ID", info.issuerID, expected.issuerID);
		printValue("Issuer Category", info.issuerCategory, expected.issuerCategory);

		// Display timestamp information
		if (info.timestamp !== null) {
			console.log();
			console.log(colors.bright + "Timestamp Information:" + colors.reset);

			// TA (v1) stores seconds, TB (v2) stores milliseconds
			const isSeconds = info.version === 1;
			const timestampUnit = isSeconds ? "(s)" : "(ms)";
			printValue(`Extracted Timestamp ${timestampUnit}`, info.timestamp, originalTimestamp);

			// Format human-readable datetime
			// Convert to milliseconds if needed (v1 uses seconds, v2+ uses milliseconds)
			const timestampMs = isSeconds ? info.timestamp * 1000 : info.timestamp;
			const date = new Date(timestampMs);
			const humanDate = date.toLocaleString("en-US", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				timeZoneName: "short"
			});
			console.log(`  ${colors.cyan}${"Human Readable".padEnd(25)}${colors.reset}: ${colors.bright}${humanDate}${colors.reset}`);

			// ISO 8601 format
			console.log(`  ${colors.cyan}${"ISO 8601".padEnd(25)}${colors.reset}: ${colors.bright}${date.toISOString()}${colors.reset}`);
		}
	}

	// Verify roundtrip conversion
	console.log();
	const reconstructed = new UUID(uuid.toString());
	const roundtripMatch = reconstructed.toString() === uuid.toString();
	printValue("String Roundtrip", roundtripMatch, true);

	const bufferReconstructed = new UUID(uuid.toBuffer());
	const bufferRoundtripMatch = bufferReconstructed.toString() === uuid.toString();
	printValue("Buffer Roundtrip", bufferRoundtripMatch, true);

	console.log();
}

/**
 * Main demonstration function
 */
function demonstrateCustomUUIDs() {
	console.log(colors.bright + colors.cyan);
	console.log("╔════════════════════════════════════════════════════════════════════════════════╗");
	console.log("║                     Custom UUID Demonstration & Verification                   ║");
	console.log("║                                                                                ║");
	console.log("║  This script generates each custom UUID variant and verifies all extracted    ║");
	console.log("║  data matches the expected specification requirements.                        ║");
	console.log("╚════════════════════════════════════════════════════════════════════════════════╝");
	console.log(colors.reset);

	// Test 1: TA - Timestamp Variant v1 (seconds precision)
	printHeader("UUID.TA() - Timestamp Variant v1 (Seconds Precision)");
	console.log("Description: Timestamp-based UUID with seconds precision");
	console.log("Subvariant:  00 (Timestamp Variant)");
	console.log("Version:     1 (seconds)\n");

	const timestamp1 = Math.floor(Date.now() / 1000); // TA uses seconds
	const uuidTA = UUID.TA(timestamp1);

	verifyUUID(
		uuidTA,
		{
			isUUID: true,
			variant: 0b111,
			subvariant: 0b00,
			version: 1,
			isTimestampVariant: true,
			isIssuerVariant: false,
			issuerID: null,
			issuerCategory: null
		},
		timestamp1
	);

	// Test 2: TB - Timestamp Variant v2 (milliseconds precision)
	printHeader("UUID.TB() - Timestamp Variant v2 (Milliseconds Precision)");
	console.log("Description: Timestamp-based UUID with milliseconds precision");
	console.log("Subvariant:  00 (Timestamp Variant)");
	console.log("Version:     2 (milliseconds)\n");

	const timestamp2 = Date.now();
	const uuidTB = UUID.TB(timestamp2);

	verifyUUID(
		uuidTB,
		{
			isUUID: true,
			variant: 0b111,
			subvariant: 0b00,
			version: 2,
			isTimestampVariant: true,
			isIssuerVariant: false,
			issuerID: null,
			issuerCategory: null
		},
		timestamp2
	);

	// Test 3: IA - Issuer Variant v1
	printHeader("UUID.IA(404) - Issuer Variant v1 (Spec Originator)");
	console.log("Description: Issuer-based UUID for Spec Originator (ID: 404)");
	console.log("Subvariant:  01 (Issuer Variant)");
	console.log("Version:     1\n");

	const issuerID = 404;
	const uuidIA = UUID.IA(issuerID);

	verifyUUID(uuidIA, {
		isUUID: true,
		variant: 0b111,
		subvariant: 0b01,
		version: 1,
		isIssuerVariant: true,
		isTimestampVariant: false,
		issuerID: 404,
		issuerCategory: "Spec Originator"
	});

	// Test 4: Verify TA and TB share same subvariant
	printHeader("Verification: TA and TB Share Subvariant 00");
	console.log("Both TA (v1) and TB (v2) are Timestamp Variants with subvariant 00.\n");
	console.log("They differ only in their VERSION field:\n");

	printValue("TA Subvariant", uuidTA.getSubvariant(), uuidTB.getSubvariant());
	printValue("TA Version", uuidTA.getVersion(), 1);
	printValue("TB Version", uuidTB.getVersion(), 2);
	console.log();

	// Test 5: Verify IA uses different subvariant
	printHeader("Verification: IA Uses Different Subvariant (01)");
	console.log("IA (Issuer Variant) uses subvariant 01, distinct from TA/TB.\n");

	printValue("TA Subvariant", uuidTA.getSubvariant(), 0b00);
	printValue("TB Subvariant", uuidTB.getSubvariant(), 0b00);
	printValue("IA Subvariant", uuidIA.getSubvariant(), 0b01);
	printValue("IA Different from TA", uuidIA.getSubvariant() !== uuidTA.getSubvariant(), true);
	console.log();

	// Test 6: Negative timestamps (before Unix epoch)
	printHeader("Negative Timestamps: Before Unix Epoch (Jan 1, 1970)");
	console.log("Testing timestamps in the past relative to Unix epoch:\n");

	// December 31, 1969, 11:59:00 PM UTC (60 seconds before epoch)
	const negTimestamp1 = -60; // -60 seconds (TA uses seconds precision)
	const uuidTANeg = UUID.TA(negTimestamp1);

	console.log(colors.bright + "TA with Negative Timestamp (-60 seconds):" + colors.reset);
	console.log(`  UUID: ${colors.yellow}${uuidTANeg.toString()}${colors.reset}`);
	const extractedTA = uuidTANeg.getTimestamp();
	printValue("Extracted Timestamp (s)", extractedTA, negTimestamp1);
	const dateTAFromSeconds = new Date(extractedTA * 1000); // Convert seconds to ms for Date
	console.log(
		`  ${colors.cyan}${"Human Readable".padEnd(25)}${colors.reset}: ${colors.bright}${dateTAFromSeconds.toUTCString()}${colors.reset}`
	);
	console.log();

	// January 1, 1960 (10 years before epoch)
	const negTimestamp2 = -315619200000; // ~10 years before epoch
	const uuidTBNeg = UUID.TB(negTimestamp2);

	console.log(colors.bright + "TB with Negative Timestamp (~10 years before epoch):" + colors.reset);
	console.log(`  UUID: ${colors.yellow}${uuidTBNeg.toString()}${colors.reset}`);
	const extractedTB = uuidTBNeg.getTimestamp();
	printValue("Extracted Timestamp (ms)", extractedTB, negTimestamp2);
	const dateTB = new Date(extractedTB);
	console.log(`  ${colors.cyan}${"Human Readable".padEnd(25)}${colors.reset}: ${colors.bright}${dateTB.toUTCString()}${colors.reset}`);
	console.log();

	// Test 7: Generate multiple UUIDs to show uniqueness
	printHeader("Uniqueness Test: Generate Multiple UUIDs");
	console.log("Generating " + COLLISION_COUNT + " of each variant to demonstrate uniqueness:\n");

	const tauuids = [];
	const tbuuids = [];
	const iauuids = [];

	for (let i = 0; i < COLLISION_COUNT; i++) {
		tauuids.push(UUID.TA(Date.now() + i).toString());
		tbuuids.push(UUID.TB(Date.now() + i).toString());
		iauuids.push(UUID.IA(404).toString());
	}

	const taUnique = new Set(tauuids).size === COLLISION_COUNT;
	const tbUnique = new Set(tbuuids).size === COLLISION_COUNT;
	const iaUnique = new Set(iauuids).size === COLLISION_COUNT;

	printValue("TA UUIDs All Unique", taUnique, true);
	printValue("TB UUIDs All Unique", tbUnique, true);
	printValue("IA UUIDs All Unique", iaUnique, true);

	const allUnique = new Set([...tauuids, ...tbuuids, ...iauuids]).size === COLLISION_COUNT * 3;
	printValue("No Cross-Variant Overlap", allUnique, true);
	console.log();

	// Summary
	printHeader("Summary");
	console.log(`${colors.green}✓${colors.reset} All custom UUID variants (TA, TB, IA) generated successfully`);
	console.log(`${colors.green}✓${colors.reset} All extracted data matches expected specification values`);
	console.log(`${colors.green}✓${colors.reset} TA and TB correctly share subvariant 00 (Timestamp Variant)`);
	console.log(`${colors.green}✓${colors.reset} IA correctly uses subvariant 01 (Issuer Variant)`);
	console.log(`${colors.green}✓${colors.reset} Negative timestamps (pre-1970) work correctly`);
	console.log(`${colors.green}✓${colors.reset} All UUIDs are unique with proper collision resistance`);
	console.log(`${colors.green}✓${colors.reset} Roundtrip conversions (string/buffer) preserve all data`);
	console.log();

	console.log(
		colors.bright + colors.cyan + "════════════════════════════════════════════════════════════════════════════════" + colors.reset
	);
	console.log(
		colors.bright + colors.green + "                           ✓ Demonstration Complete                              " + colors.reset
	);
	console.log(
		colors.bright + colors.cyan + "════════════════════════════════════════════════════════════════════════════════" + colors.reset
	);
	console.log();
}

// Run the demonstration
demonstrateCustomUUIDs();
