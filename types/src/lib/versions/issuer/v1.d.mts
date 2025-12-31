/**
 * Create an Issuer Variant v1 UUID
 * @param {number} issuerID - Issuer ID (0-1023)
 * @param {Buffer|null} entropy - Optional entropy data (full 16 bytes)
 * @returns {Buffer} 16-byte UUID buffer
 */
export function v1(issuerID: number, entropy?: Buffer | null): Buffer;
/**
 * Parse issuer ID from an Issuer v1 UUID buffer
 * @param {Buffer} buffer - UUID buffer
 * @returns {number} Issuer ID (0-1023)
 */
export function parseIssuerID(buffer: Buffer): number;
/**
 * Validate issuer ID is within allowed range
 * @param {number} issuerID - Issuer ID to validate
 * @returns {boolean} True if valid
 */
export function validateIssuerID(issuerID: number): boolean;
/**
 * Get issuer category name for a given issuer ID
 * @param {number} issuerID - Issuer ID (0-1023)
 * @returns {string} Category name
 */
export function getIssuerCategory(issuerID: number): string;
/**
 * Create an Issuer Variant v1 UUID
 * @param {number} issuerID - Issuer ID (0-1023)
 * @param {Buffer|null} entropy - Optional entropy data (full 16 bytes)
 * @returns {Buffer} 16-byte UUID buffer
 */
export function ia(issuerID: number, entropy?: Buffer | null): Buffer;
//# sourceMappingURL=v1.d.mts.map