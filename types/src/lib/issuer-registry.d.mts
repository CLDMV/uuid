/**
 * Issuer Registry for managing issuer ID assignments
 */
export class IssuerRegistry {
    _registry: Map<any, any>;
    /**
     * Initialize reserved issuer IDs
     * @private
     */
    private _initializeReservedIDs;
    /**
     * Load issuers from JSON file
     * @private
     */
    private _loadIssuersFromFile;
    /**
     * Register a new issuer in Category A (Well-Recognized Technology Entities)
     * @param {number} issuerID - Issuer ID (2-255)
     * @param {string} name - Organization name
     * @param {string} description - Description
     * @returns {boolean} True if registration successful
     */
    registerCategoryA(issuerID: number, name: string, description: string): boolean;
    /**
     * Register a new issuer in Category B (Open Source Ecosystem Contributors)
     * @param {number} issuerID - Issuer ID (256-511)
     * @param {string} name - Organization/Project name
     * @param {string} description - Description
     * @returns {boolean} True if registration successful
     */
    registerCategoryB(issuerID: number, name: string, description: string): boolean;
    /**
     * Reserve a block of issuer IDs for future RFC expansion
     * @param {number} startID - Starting issuer ID (512-ISSUER_ID_MASK)
     * @param {number} count - Number of IDs to reserve (minimum 16)
     * @param {string} description - Description of the reservation
     * @returns {boolean} True if reservation successful
     */
    reserveFutureRFCBlock(startID: number, count: number, description: string): boolean;
    /**
     * Get issuer information by ID
     * @param {number} issuerID - Issuer ID to lookup
     * @returns {object|null} Issuer information or null if not found
     */
    getIssuer(issuerID: number): object | null;
    /**
     * Check if an issuer ID is available for registration
     * @param {number} issuerID - Issuer ID to check
     * @returns {boolean} True if available
     */
    isAvailable(issuerID: number): boolean;
    /**
     * Get all issuers in a specific category
     * @param {string} category - Category name ('Category A', 'Category B', 'Reserved', 'Future RFC')
     * @returns {Array} Array of issuer entries
     */
    getByCategory(category: string): any[];
    /**
     * Get next available issuer ID in a category
     * @param {string} category - 'A' or 'B'
     * @returns {number|null} Next available ID or null if none available
     */
    getNextAvailable(category: string): number | null;
    /**
     * Validate issuer ID is in valid range
     * @param {number} issuerID - Issuer ID to validate
     * @private
     */
    private _validateIssuerID;
    /**
     * Validate issuer ID is in Category A range
     * @param {number} issuerID - Issuer ID to validate
     * @private
     */
    private _validateCategoryAID;
    /**
     * Validate issuer ID is in Category B range
     * @param {number} issuerID - Issuer ID to validate
     * @private
     */
    private _validateCategoryBID;
    /**
     * Check if issuer ID is in a reserved range
     * @param {number} issuerID - Issuer ID to check
     * @returns {boolean} True if in reserved range
     * @private
     */
    private _isReservedRange;
    /**
     * Export registry data for persistence
     * @returns {object} Registry data
     */
    export(): object;
    /**
     * Import registry data
     * @param {object} data - Registry data to import
     */
    import(data: object): void;
    /**
     * Get registry statistics
     * @returns {object} Registry statistics
     */
    getStats(): object;
}
//# sourceMappingURL=issuer-registry.d.mts.map