/**
 *	@Project: @cldmv/slothlet
 *	@Filename: /src/lib/issuer-registry.mjs
 *	@Date: 2025-12-15T20:33:49-08:00 (1765859629)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-03-04 21:03:43 -08:00 (1772687023)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Issuer Registry Management
 *
 * This module manages the issuer ID registry according to the custom UUID specification.
 * It handles issuer ID allocation, validation, and category management.
 */

import { ISSUER_CATEGORIES, ISSUER_ID_MASK } from "./constants.mjs";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Issuer Registry for managing issuer ID assignments
 */
class IssuerRegistry {
	constructor() {
		this._registry = new Map();
		this._initializeReservedIDs();
		this._loadIssuersFromFile();
	}

	/**
	 * Initialize reserved issuer IDs
	 * @private
	 */
	_initializeReservedIDs() {
		// Immutable reserved IDs
		this._registry.set(ISSUER_CATEGORIES.UNASSIGNED, {
			name: "Unassigned/Open",
			category: "Reserved",
			description: "Open for all use, unreserved",
			immutable: true,
			reserved: true
		});

		this._registry.set(ISSUER_CATEGORIES.DRAFTER_RESERVED, {
			name: "Drafter Reserved",
			category: "Reserved",
			description: "Reserved for specification drafter",
			immutable: true,
			reserved: true
		});

		this._registry.set(ISSUER_CATEGORIES.SPEC_ORIGINATOR, {
			name: "Specification Originator",
			category: "Reserved",
			description: "Reserved by specification originator",
			immutable: true,
			reserved: true
		});
	}

	/**
	 * Load issuers from JSON file
	 * @private
	 */
	_loadIssuersFromFile() {
		try {
			const jsonPath = join(__dirname, "../data/issuers.json");
			const jsonData = readFileSync(jsonPath, "utf-8");
			const data = JSON.parse(jsonData);

			// Load Category A issuers
			if (data.categoryA && data.categoryA.issuers) {
				for (const [idStr, info] of Object.entries(data.categoryA.issuers)) {
					const id = parseInt(idStr, 10);
					this._registry.set(id, {
						...info,
						category: "Category A",
						immutable: false,
						reserved: false
					});
				}
			}

			// Load Category B issuers
			if (data.categoryB && data.categoryB.issuers) {
				for (const [idStr, info] of Object.entries(data.categoryB.issuers)) {
					const id = parseInt(idStr, 10);
					this._registry.set(id, {
						...info,
						category: "Category B",
						immutable: false,
						reserved: false
					});
				}
			}

			// Load future RFC blocks
			if (data.futureRFC && data.futureRFC.blocks) {
				for (const block of data.futureRFC.blocks) {
					if (block.startID && block.count) {
						this.reserveFutureRFCBlock(block.startID, block.count, block.description || "Reserved block");
					}
				}
			}
		} catch (error) {
			// If file doesn't exist or is invalid, continue with just reserved IDs
			console.warn(`Could not load issuers.json: ${error.message}`);
		}
	}

	/**
	 * Register a new issuer in Category A (Well-Recognized Technology Entities)
	 * @param {number} issuerID - Issuer ID (2-255)
	 * @param {string} name - Organization name
	 * @param {string} description - Description
	 * @returns {boolean} True if registration successful
	 */
	registerCategoryA(issuerID, name, description) {
		this._validateCategoryAID(issuerID);

		if (this._registry.has(issuerID)) {
			throw new Error(`Issuer ID ${issuerID} is already registered`);
		}

		this._registry.set(issuerID, {
			name,
			category: "Category A",
			description,
			immutable: false,
			reserved: false,
			registeredAt: new Date()
		});

		return true;
	}

	/**
	 * Register a new issuer in Category B (Open Source Ecosystem Contributors)
	 * @param {number} issuerID - Issuer ID (256-511)
	 * @param {string} name - Organization/Project name
	 * @param {string} description - Description
	 * @returns {boolean} True if registration successful
	 */
	registerCategoryB(issuerID, name, description) {
		this._validateCategoryBID(issuerID);

		if (this._registry.has(issuerID)) {
			throw new Error(`Issuer ID ${issuerID} is already registered`);
		}

		this._registry.set(issuerID, {
			name,
			category: "Category B",
			description,
			immutable: false,
			reserved: false,
			registeredAt: new Date()
		});

		return true;
	}

	/**
	 * Reserve a block of issuer IDs for future RFC expansion
	 * @param {number} startID - Starting issuer ID (512-ISSUER_ID_MASK)
	 * @param {number} count - Number of IDs to reserve (minimum 16)
	 * @param {string} description - Description of the reservation
	 * @returns {boolean} True if reservation successful
	 */
	reserveFutureRFCBlock(startID, count, description) {
		if (count < 16) {
			throw new Error("Future RFC reservations must be at least 16 IDs");
		}

		if (startID < ISSUER_CATEGORIES.FUTURE_RFC_START || startID + count - 1 > ISSUER_CATEGORIES.FUTURE_RFC_END) {
			throw new Error(`Invalid future RFC range: ${startID}-${startID + count - 1}`);
		}

		// Check if any IDs in the range are already registered
		for (let id = startID; id < startID + count; id++) {
			if (this._registry.has(id)) {
				throw new Error(`Issuer ID ${id} is already registered`);
			}
		}

		// Reserve the entire block
		for (let id = startID; id < startID + count; id++) {
			this._registry.set(id, {
				name: `Future RFC Block ${startID}-${startID + count - 1}`,
				category: "Future RFC",
				description,
				immutable: false,
				reserved: true,
				blockStart: startID,
				blockSize: count,
				reservedAt: new Date()
			});
		}

		return true;
	}

	/**
	 * Get issuer information by ID
	 * @param {number} issuerID - Issuer ID to lookup
	 * @returns {object|null} Issuer information or null if not found
	 */
	getIssuer(issuerID) {
		return this._registry.get(issuerID) || null;
	}

	/**
	 * Check if an issuer ID is available for registration
	 * @param {number} issuerID - Issuer ID to check
	 * @returns {boolean} True if available
	 */
	isAvailable(issuerID) {
		this._validateIssuerID(issuerID);
		return !this._registry.has(issuerID) && !this._isReservedRange(issuerID);
	}

	/**
	 * Get all issuers in a specific category
	 * @param {string} category - Category name ('Category A', 'Category B', 'Reserved', 'Future RFC')
	 * @returns {Array} Array of issuer entries
	 */
	getByCategory(category) {
		const result = [];
		for (const [id, info] of this._registry.entries()) {
			if (info.category === category) {
				result.push({ id, ...info });
			}
		}
		return result.sort((a, b) => a.id - b.id);
	}

	/**
	 * Get next available issuer ID in a category
	 * @param {string} category - 'A' or 'B'
	 * @returns {number|null} Next available ID or null if none available
	 */
	getNextAvailable(category) {
		let start, end;

		if (category === "A") {
			start = ISSUER_CATEGORIES.CATEGORY_A_START;
			end = ISSUER_CATEGORIES.CATEGORY_A_END;
		} else if (category === "B") {
			start = ISSUER_CATEGORIES.CATEGORY_B_START;
			end = ISSUER_CATEGORIES.CATEGORY_B_END;
		} else {
			throw new Error('Invalid category. Use "A" or "B"');
		}

		for (let id = start; id <= end; id++) {
			if (!this._registry.has(id)) {
				return id;
			}
		}

		return null; // No available IDs
	}

	/**
	 * Validate issuer ID is in valid range
	 * @param {number} issuerID - Issuer ID to validate
	 * @private
	 */
	_validateIssuerID(issuerID) {
		if (!Number.isInteger(issuerID) || issuerID < 0 || issuerID > ISSUER_ID_MASK) {
			throw new Error(`Invalid issuer ID: ${issuerID}. Must be 0-${ISSUER_ID_MASK}.`);
		}
	}

	/**
	 * Validate issuer ID is in Category A range
	 * @param {number} issuerID - Issuer ID to validate
	 * @private
	 */
	_validateCategoryAID(issuerID) {
		this._validateIssuerID(issuerID);
		if (issuerID < ISSUER_CATEGORIES.CATEGORY_A_START || issuerID > ISSUER_CATEGORIES.CATEGORY_A_END) {
			throw new Error(
				`Invalid Category A issuer ID: ${issuerID}. Must be ${ISSUER_CATEGORIES.CATEGORY_A_START}-${ISSUER_CATEGORIES.CATEGORY_A_END}.`
			);
		}
	}

	/**
	 * Validate issuer ID is in Category B range
	 * @param {number} issuerID - Issuer ID to validate
	 * @private
	 */
	_validateCategoryBID(issuerID) {
		this._validateIssuerID(issuerID);
		if (issuerID < ISSUER_CATEGORIES.CATEGORY_B_START || issuerID > ISSUER_CATEGORIES.CATEGORY_B_END) {
			throw new Error(
				`Invalid Category B issuer ID: ${issuerID}. Must be ${ISSUER_CATEGORIES.CATEGORY_B_START}-${ISSUER_CATEGORIES.CATEGORY_B_END}.`
			);
		}
	}

	/**
	 * Check if issuer ID is in a reserved range
	 * @param {number} issuerID - Issuer ID to check
	 * @returns {boolean} True if in reserved range
	 * @private
	 */
	_isReservedRange(issuerID) {
		// Check immutable reserved IDs
		return (
			issuerID === ISSUER_CATEGORIES.UNASSIGNED ||
			issuerID === ISSUER_CATEGORIES.DRAFTER_RESERVED ||
			issuerID === ISSUER_CATEGORIES.SPEC_ORIGINATOR
		);
	}

	/**
	 * Export registry data for persistence
	 * @returns {object} Registry data
	 */
	export() {
		const data = {};
		for (const [id, info] of this._registry.entries()) {
			data[id] = { ...info };
		}
		return {
			version: "1.0",
			exportedAt: new Date(),
			registry: data
		};
	}

	/**
	 * Import registry data
	 * @param {object} data - Registry data to import
	 */
	import(data) {
		if (!data.registry) {
			throw new Error("Invalid import data format");
		}

		this._registry.clear();
		this._initializeReservedIDs();

		for (const [id, info] of Object.entries(data.registry)) {
			const issuerID = parseInt(id, 10);
			// Don't overwrite immutable reserved IDs
			if (!this._isReservedRange(issuerID) || !this._registry.has(issuerID)) {
				this._registry.set(issuerID, { ...info });
			}
		}
	}

	/**
	 * Get registry statistics
	 * @returns {object} Registry statistics
	 */
	getStats() {
		const stats = {
			total: this._registry.size,
			categoryA: 0,
			categoryB: 0,
			reserved: 0,
			futureRFC: 0,
			available: {
				categoryA: 0,
				categoryB: 0,
				futureRFC: 0
			}
		};

		// Count registered issuers
		for (const [id, info] of this._registry.entries()) {
			switch (info.category) {
				case "Category A":
					stats.categoryA++;
					break;
				case "Category B":
					stats.categoryB++;
					break;
				case "Reserved":
					stats.reserved++;
					break;
				case "Future RFC":
					stats.futureRFC++;
					break;
			}
		}

		// Count available slots
		for (let id = ISSUER_CATEGORIES.CATEGORY_A_START; id <= ISSUER_CATEGORIES.CATEGORY_A_END; id++) {
			if (!this._registry.has(id)) stats.available.categoryA++;
		}

		for (let id = ISSUER_CATEGORIES.CATEGORY_B_START; id <= ISSUER_CATEGORIES.CATEGORY_B_END; id++) {
			if (!this._registry.has(id)) stats.available.categoryB++;
		}

		for (let id = ISSUER_CATEGORIES.FUTURE_RFC_START; id <= ISSUER_CATEGORIES.FUTURE_RFC_END; id++) {
			if (!this._registry.has(id)) stats.available.futureRFC++;
		}

		return stats;
	}
}

export { IssuerRegistry };
