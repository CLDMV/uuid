/**
 * UUID class implementing the new specification
 */
export class UUID {
    /**
     * Create a new Issuer Variant UUID
     * @param {number} issuerID - Issuer ID (0-ISSUER_ID_MASK)
     * @param {number} version - Version number
     * @param {Buffer} entropy - Additional entropy data
     * @returns {UUID} New UUID instance
     */
    static createIssuerVariant(issuerID: number, version: number, entropy?: Buffer): UUID;
    /**
     * Create a new Timestamp Variant UUID
     * @param {number|Date} timestamp - Timestamp value (optional, defaults to Date.now())
     * @param {number} version - Version number
     * @param {Buffer} entropy - Optional entropy for bits 79-127
     * @returns {UUID} New UUID instance
     */
    static createTimestampVariant(timestamp: number | Date, version: number, entropy?: Buffer): UUID;
    /**
     * Create an issuer-based UUID (short name alias)
     * @param {number} issuerID - Issuer ID (0-1023)
     * @param {number} version - Version number
     * @param {Buffer} entropy - Additional entropy data
     * @returns {UUID} New UUID instance
     */
    static issuer(issuerID: number, version: number, entropy?: Buffer): UUID;
    /**
     * Create a timestamp-based UUID (short name alias)
     * @param {number|Date} timestamp - Timestamp value (optional, defaults to Date.now())
     * @param {number} version - Version number
     * @param {Buffer} entropy - Optional entropy for bits 79-127
     * @returns {UUID} New UUID instance
     */
    static timestamp(timestamp: number | Date, version: number, entropy?: Buffer): UUID;
    /**
     * Create Timestamp Variant v1 UUID (ultra-short alias)
     * Subvariant 00 - Timestamp-based identification (seconds precision)
     * @param {number|Date} timestamp - Timestamp value (optional, defaults to Date.now())
     * @param {Buffer} entropy - Optional entropy for bits 79-127
     * @returns {UUID} New UUID instance
     */
    static TA(timestamp: number | Date, entropy?: Buffer): UUID;
    /**
     * Create Issuer Variant v1 UUID (ultra-short alias)
     * Subvariant 01 - Issuer-based identification
     * @param {number} issuerID - Issuer ID (0-1023)
     * @param {Buffer} entropy - Additional entropy data
     * @returns {UUID} New UUID instance
     */
    static IA(issuerID: number, entropy?: Buffer): UUID;
    /**
     * Create Timestamp Variant v2 UUID (ultra-short alias)
     * Subvariant 00 - Timestamp-based identification (milliseconds precision)
     * @param {number|Date} timestamp - Timestamp value (optional, defaults to Date.now())
     * @param {Buffer} entropy - Optional entropy for bits 79-127
     * @returns {UUID} New UUID instance
     */
    static TB(timestamp: number | Date, entropy?: Buffer): UUID;
    /**
     * Get the shared issuer registry instance
     * @returns {Promise<IssuerRegistry>} Shared registry instance
     */
    static getRegistry(): Promise<IssuerRegistry>;
    /**
     * Register a new issuer in Category A
     * @param {number} issuerID - Issuer ID (2-255)
     * @param {string} name - Organization name
     * @param {string} description - Description
     * @returns {Promise<boolean>} True if successful
     */
    static registerIssuerA(issuerID: number, name: string, description: string): Promise<boolean>;
    /**
     * Register a new issuer in Category B
     * @param {number} issuerID - Issuer ID (256-511)
     * @param {string} name - Organization/Project name
     * @param {string} description - Description
     * @returns {Promise<boolean>} True if successful
     */
    static registerIssuerB(issuerID: number, name: string, description: string): Promise<boolean>;
    /**
     * Get issuer information by ID
     * @param {number} issuerID - Issuer ID to lookup
     * @returns {Promise<object|null>} Issuer information or null
     */
    static getIssuerInfo(issuerID: number): Promise<object | null>;
    /**
     * Validate a UUID buffer for specification compliance
     * @param {Buffer} buffer - UUID buffer to validate
     * @returns {Promise<object>} Validation results
     */
    static validate(buffer: Buffer): Promise<object>;
    /**
     * Generate a complete validation report for a UUID
     * @param {Buffer} buffer - UUID buffer to validate
     * @returns {Promise<object>} Detailed validation report
     */
    static validateDetailed(buffer: Buffer): Promise<object>;
    /**
     * Generate a version 1 (timestamp) UUID
     * @param {Object} options - Optional parameters
     * @returns {string} UUID string
     */
    static v1(options: any): string;
    /**
     * Generate a version 3 (namespace with MD5) UUID
     * @param {string} name - Name to hash
     * @param {string|Uint8Array} namespace - Namespace UUID
     * @returns {string} UUID string
     */
    static v3(name: string, namespace: string | Uint8Array): string;
    /**
     * Generate a version 4 (random) UUID
     * @param {Object} options - Optional parameters
     * @returns {string} UUID string
     */
    static v4(options: any): string;
    /**
     * Generate a version 5 (namespace with SHA-1) UUID
     * @param {string} name - Name to hash
     * @param {string|Uint8Array} namespace - Namespace UUID
     * @returns {string} UUID string
     */
    static v5(name: string, namespace: string | Uint8Array): string;
    /**
     * Generate a version 6 (timestamp, reordered) UUID
     * @param {Object} options - Optional parameters
     * @returns {string} UUID string
     */
    static v6(options: any): string;
    /**
     * Generate a version 7 (Unix Epoch) UUID
     * @param {Object} options - Optional parameters
     * @returns {string} UUID string
     */
    static v7(options: any): string;
    /**
     * Convert UUID string to byte array
     * @param {string} uuid - UUID string
     * @returns {Uint8Array} 16-byte array
     */
    static parse(uuid: string): Uint8Array;
    /**
     * Convert byte array to UUID string
     * @param {Uint8Array|Buffer|Array} bytes - 16-byte array
     * @returns {string} UUID string
     */
    static stringify(bytes: Uint8Array | Buffer | any[]): string;
    /**
     * Validate UUID string format
     * @param {string} uuid - UUID string to validate
     * @returns {boolean} True if valid
     */
    static validateRFC(uuid: string): boolean;
    /**
     * Detect RFC version of UUID
     * @param {string} uuid - UUID string
     * @returns {number|null} Version number or null
     */
    static version(uuid: string): number | null;
    /**
     * Create a new UUID instance
     * @param {Buffer|string|null} data - Optional UUID data to parse
     */
    constructor(data?: Buffer | string | null);
    _buffer: any;
    /**
     * Parse UUID from existing data
     * @param {Buffer|string} data - UUID data to parse
     * @private
     */
    private _parseFromData;
    /**
     * Set 70-bit timestamp according to specification
     * @param {number} timestampValue - Timestamp value (in seconds for v1, milliseconds for v2)
     * @private
     */
    private _setTimestamp;
    /**
     * Fill remaining bits with entropy while preserving immutable fields
     * @param {Buffer} entropy - Entropy data
     * @private
     */
    private _fillEntropy;
    /**
     * Set the variant field (internal method)
     * @param {number} variant - Variant value
     * @private
     */
    private _setVariant;
    /**
     * Set the subvariant field (internal method)
     * @param {number} subvariant - Subvariant value
     * @private
     */
    private _setSubvariant;
    /**
     * Set the version field (internal method)
     * @param {number} version - Version value
     * @private
     */
    private _setVersion;
    /**
     * Set the issuer ID field (internal method)
     * @param {number} issuerID - Issuer ID value
     * @private
     */
    private _setIssuerID;
    /**
     * Get the variant field
     * @returns {number} Variant value (should be 7 for these UUIDs)
     */
    getVariant(): number;
    /**
     * Get the subvariant field
     * @returns {number} Subvariant value
     */
    getSubvariant(): number;
    /**
     * Get the version field
     * @returns {number} Version value
     */
    getVersion(): number;
    /**
     * Get the issuer ID field
     * @returns {number} Issuer ID (0-ISSUER_ID_MASK)
     */
    getIssuerID(): number;
    /**
     * Check if this UUID is a valid UUID (variant = 111)
     * @returns {boolean} True if valid UUID
     */
    isUUID(): boolean;
    /**
     * Check if this is an Issuer Variant UUID
     * @returns {boolean} True if issuer variant
     */
    isIssuerVariant(): boolean;
    /**
     * Check if this is a Timestamp Variant UUID
     * @returns {boolean} True if timestamp variant
     */
    isTimestampVariant(): boolean;
    /**
     * Get issuer category based on issuer ID
     * @returns {string} Issuer category name
     */
    getIssuerCategory(): string;
    /**
     * Convert UUID to string representation
     * @returns {string} UUID string with dashes
     */
    toString(): string;
    /**
     * Convert UUID to buffer
     * @returns {Buffer} UUID as 16-byte buffer
     */
    toBuffer(): Buffer;
    /**
     * Get detailed information about this UUID
     * @returns {object} UUID information object
     */
    getInfo(): object;
}
export namespace UUID {
    let NIL: string;
    let MAX: string;
    let DNS: string;
    let URL: string;
    let OID: string;
    let X500: string;
}
import { ISSUER_CATEGORIES } from "./lib/constants.mjs";
export { UUID as uuid, ISSUER_CATEGORIES };
//# sourceMappingURL=uuid.d.mts.map