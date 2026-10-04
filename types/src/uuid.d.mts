/**
 * Options shared by the RFC generators that can write into a caller-supplied buffer.
 */
export type RFCBufferOptions = {
    /**
     * - Buffer to write the UUID into; when given, the generator returns it instead of a string
     */
    buf?: Uint8Array;
    /**
     * - Offset in `buf` to start writing at (default 0)
     */
    offset?: number;
};
/**
 * Options for {@link UUID.v1} and {@link UUID.v6}. `node` is the 6-byte node id (MAC address),
 * `clockseq` the 14-bit clock sequence, `msecs` the timestamp in milliseconds since the Unix
 * epoch, and `nsecs` additional 100-nanosecond intervals.
 */
export type TimeOptions = RFCBufferOptions & {
    node?: ArrayLike<number>;
    clockseq?: number;
    msecs?: number;
    nsecs?: number;
};
/**
 * Options for {@link UUID.v4}. `random` supplies the 16 random bytes instead of generating them.
 */
export type V4Options = RFCBufferOptions & {
    random?: Uint8Array;
};
/**
 * Options for {@link UUID.v7}. `msecs` is the timestamp in milliseconds since the Unix epoch.
 */
export type V7Options = RFCBufferOptions & {
    msecs?: number;
};
/**
 * Options for {@link UUID.v8}. `data` supplies the 16 bytes of custom data instead of random bytes.
 */
export type V8Options = RFCBufferOptions & {
    data?: Uint8Array;
};
/**
 * Options shared by the RFC generators that can write into a caller-supplied buffer.
 * @typedef {object} RFCBufferOptions
 * @property {Uint8Array} [buf] - Buffer to write the UUID into; when given, the generator returns it instead of a string
 * @property {number} [offset] - Offset in `buf` to start writing at (default 0)
 */
/**
 * Options for {@link UUID.v1} and {@link UUID.v6}. `node` is the 6-byte node id (MAC address),
 * `clockseq` the 14-bit clock sequence, `msecs` the timestamp in milliseconds since the Unix
 * epoch, and `nsecs` additional 100-nanosecond intervals.
 * @typedef {RFCBufferOptions & { node?: ArrayLike<number>, clockseq?: number, msecs?: number, nsecs?: number }} TimeOptions
 */
/**
 * Options for {@link UUID.v4}. `random` supplies the 16 random bytes instead of generating them.
 * @typedef {RFCBufferOptions & { random?: Uint8Array }} V4Options
 */
/**
 * Options for {@link UUID.v7}. `msecs` is the timestamp in milliseconds since the Unix epoch.
 * @typedef {RFCBufferOptions & { msecs?: number }} V7Options
 */
/**
 * Options for {@link UUID.v8}. `data` supplies the 16 bytes of custom data instead of random bytes.
 * @typedef {RFCBufferOptions & { data?: Uint8Array }} V8Options
 */
/**
 * UUID class implementing the new specification
 */
export class UUID {
    /**
     * Create a new Issuer Variant UUID
     * @param {number} issuerID - Issuer ID (0-ISSUER_ID_MASK)
     * @param {number} version - Version number
     * @param {Uint8Array|null} [entropy] - Additional entropy data
     * @returns {UUID} New UUID instance
     */
    static createIssuerVariant(issuerID: number, version: number, entropy?: Uint8Array | null): UUID;
    /**
     * Create a new Timestamp Variant UUID
     * @param {number|Date|null|undefined} timestamp - Timestamp value (null/undefined defaults to the current time)
     * @param {number} version - Version number
     * @param {Uint8Array|null} [entropy] - Optional entropy for bits 79-127
     * @returns {UUID} New UUID instance
     */
    static createTimestampVariant(timestamp: number | Date | null | undefined, version: number, entropy?: Uint8Array | null): UUID;
    /**
     * Create an issuer-based UUID (short name alias)
     * @param {number} issuerID - Issuer ID (0-1023)
     * @param {number} version - Version number
     * @param {Uint8Array|null} [entropy] - Additional entropy data
     * @returns {UUID} New UUID instance
     */
    static issuer(issuerID: number, version: number, entropy?: Uint8Array | null): UUID;
    /**
     * Create a timestamp-based UUID (short name alias)
     * @param {number|Date|null|undefined} timestamp - Timestamp value (null/undefined defaults to the current time)
     * @param {number} version - Version number
     * @param {Uint8Array|null} [entropy] - Optional entropy for bits 79-127
     * @returns {UUID} New UUID instance
     */
    static timestamp(timestamp: number | Date | null | undefined, version: number, entropy?: Uint8Array | null): UUID;
    /**
     * Create Timestamp Variant v1 UUID (ultra-short alias)
     * Subvariant 00 - Timestamp-based identification (seconds precision)
     * @param {number|Date|null} [timestamp] - Timestamp value (optional, defaults to the current time)
     * @param {Uint8Array|null} [entropy] - Optional entropy for bits 79-127
     * @returns {UUID} New UUID instance
     */
    static TA(timestamp?: number | Date | null, entropy?: Uint8Array | null): UUID;
    /**
     * Create Issuer Variant v1 UUID (ultra-short alias)
     * Subvariant 01 - Issuer-based identification
     * @param {number} issuerID - Issuer ID (0-1023)
     * @param {Uint8Array|null} [entropy] - Additional entropy data
     * @returns {UUID} New UUID instance
     */
    static IA(issuerID: number, entropy?: Uint8Array | null): UUID;
    /**
     * Create Timestamp Variant v2 UUID (ultra-short alias)
     * Subvariant 00 - Timestamp-based identification (milliseconds precision)
     * @param {number|Date|null} [timestamp] - Timestamp value (optional, defaults to the current time)
     * @param {Uint8Array|null} [entropy] - Optional entropy for bits 79-127
     * @returns {UUID} New UUID instance
     */
    static TB(timestamp?: number | Date | null, entropy?: Uint8Array | null): UUID;
    /**
     * Get the shared issuer registry instance
     * @returns {Promise<import("./lib/issuer-registry.mjs").IssuerRegistry>} Shared registry instance
     */
    static getRegistry(): Promise<import("./lib/issuer-registry.mjs").IssuerRegistry>;
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
     * @param {Uint8Array} buffer - UUID buffer to validate
     * @returns {Promise<object>} Validation results
     */
    static validate(buffer: Uint8Array): Promise<object>;
    /**
     * Generate a complete validation report for a UUID
     * @param {Uint8Array} buffer - UUID buffer to validate
     * @returns {Promise<object>} Detailed validation report
     */
    static validateDetailed(buffer: Uint8Array): Promise<object>;
    /**
     * Generate a version 1 (timestamp) UUID
     * @overload
     * @param {TimeOptions & { buf?: undefined }} [options] - Optional parameters
     * @returns {string} UUID string
     */
    static v1(options?: TimeOptions & {
        buf?: undefined;
    }): string;
    /**
     * Generate a version 1 (timestamp) UUID, written into `options.buf`
     * @overload
     * @param {TimeOptions & { buf: Uint8Array }} options - Options with the buffer to write into
     * @returns {Uint8Array} `options.buf`
     */
    static v1(options: TimeOptions & {
        buf: Uint8Array;
    }): Uint8Array;
    /**
     * Generate a version 3 (namespace with MD5) UUID
     * @param {string} name - Name to hash
     * @param {string|Uint8Array} namespace - Namespace UUID
     * @returns {string} UUID string
     */
    static v3(name: string, namespace: string | Uint8Array): string;
    /**
     * Generate a version 4 (random) UUID
     * @overload
     * @param {V4Options & { buf?: undefined }} [options] - Optional parameters
     * @returns {string} UUID string
     */
    static v4(options?: V4Options & {
        buf?: undefined;
    }): string;
    /**
     * Generate a version 4 (random) UUID, written into `options.buf`
     * @overload
     * @param {V4Options & { buf: Uint8Array }} options - Options with the buffer to write into
     * @returns {Uint8Array} `options.buf`
     */
    static v4(options: V4Options & {
        buf: Uint8Array;
    }): Uint8Array;
    /**
     * Generate a version 5 (namespace with SHA-1) UUID
     * @param {string} name - Name to hash
     * @param {string|Uint8Array} namespace - Namespace UUID
     * @returns {string} UUID string
     */
    static v5(name: string, namespace: string | Uint8Array): string;
    /**
     * Generate a version 6 (timestamp, reordered) UUID
     * @overload
     * @param {TimeOptions & { buf?: undefined }} [options] - Optional parameters
     * @returns {string} UUID string
     */
    static v6(options?: TimeOptions & {
        buf?: undefined;
    }): string;
    /**
     * Generate a version 6 (timestamp, reordered) UUID, written into `options.buf`
     * @overload
     * @param {TimeOptions & { buf: Uint8Array }} options - Options with the buffer to write into
     * @returns {Uint8Array} `options.buf`
     */
    static v6(options: TimeOptions & {
        buf: Uint8Array;
    }): Uint8Array;
    /**
     * Generate a version 7 (Unix Epoch) UUID
     * @overload
     * @param {V7Options & { buf?: undefined }} [options] - Optional parameters
     * @returns {string} UUID string
     */
    static v7(options?: V7Options & {
        buf?: undefined;
    }): string;
    /**
     * Generate a version 7 (Unix Epoch) UUID, written into `options.buf`
     * @overload
     * @param {V7Options & { buf: Uint8Array }} options - Options with the buffer to write into
     * @returns {Uint8Array} `options.buf`
     */
    static v7(options: V7Options & {
        buf: Uint8Array;
    }): Uint8Array;
    /**
     * Generate a version 8 (custom/experimental) UUID
     * @overload
     * @param {V8Options & { buf?: undefined }} [options] - Optional parameters
     * @returns {string} UUID string
     */
    static v8(options?: V8Options & {
        buf?: undefined;
    }): string;
    /**
     * Generate a version 8 (custom/experimental) UUID, written into `options.buf`
     * @overload
     * @param {V8Options & { buf: Uint8Array }} options - Options with the buffer to write into
     * @returns {Uint8Array} `options.buf`
     */
    static v8(options: V8Options & {
        buf: Uint8Array;
    }): Uint8Array;
    /**
     * Convert UUID string to byte array
     * @param {string} uuid - UUID string
     * @returns {Uint8Array} 16-byte array
     */
    static parse(uuid: string): Uint8Array;
    /**
     * Convert byte array to UUID string
     * @param {ArrayLike<number>} bytes - 16-byte array (Uint8Array, Buffer or plain array)
     * @returns {string} UUID string
     */
    static stringify(bytes: ArrayLike<number>): string;
    /**
     * Validate UUID string format
     * @param {string} uuid - UUID string to validate
     * @returns {boolean} True if valid
     */
    static validateRFC(uuid: string): boolean;
    /**
     * Detect version/variant identifier of UUID (handles both RFC and custom variants)
     * @param {string|Uint8Array|UUID} uuid - UUID string, buffer, or UUID instance
     * @returns {string|number|null} Version identifier (e.g., "TA", "TB", "IA" for custom, 1-8 for RFC, or null if invalid)
     * @example
     * UUID.version(uuidString); // => "TA" for Timestamp v1
     * UUID.version(uuidString); // => "TB" for Timestamp v2
     * UUID.version(uuidString); // => "IA" for Issuer v1
     * UUID.version(uuidString); // => 4 for RFC v4
     */
    static version(uuid: string | Uint8Array | UUID): string | number | null;
    /**
     * Detect variant identifier (alias for version())
     * @param {string|Uint8Array|UUID} uuid - UUID string, buffer, or UUID instance
     * @returns {string|number|null} Version identifier
     * @deprecated Use UUID.version() instead
     */
    static detectVariant(uuid: string | Uint8Array | UUID): string | number | null;
    /**
     * Create a new UUID instance
     * @param {Uint8Array|string|null} data - Optional UUID data to parse
     */
    constructor(data?: Uint8Array | string | null);
    /**
     * The 16 UUID bytes.
     * @type {Uint8Array}
     * @private
     */
    private _buffer;
    /**
     * Parse UUID from existing data
     * @param {Uint8Array|string} data - UUID data to parse
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
     * @param {Uint8Array|null} [entropy] - Entropy data
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
     * @returns {number|null} Issuer ID (0-ISSUER_ID_MASK) for Issuer Variant, null for Timestamp Variant
     */
    getIssuerID(): number | null;
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
     * Get the version/variant identifier (TA, TB, IA for custom variants, or RFC version number)
     * @returns {string|number|null} Version identifier (e.g., "TA", "TB", "IA", 1-8 for RFC, or null if invalid)
     * @example
     * uuid.version(); // => "TA" for Timestamp v1
     * uuid.version(); // => "TB" for Timestamp v2
     * uuid.version(); // => "IA" for Issuer v1
     * uuid.version(); // => 4 for RFC v4
     */
    version(): string | number | null;
    /**
     * Get issuer category based on issuer ID
     * @returns {string|null} Issuer category name, or null if not an Issuer Variant
     */
    getIssuerCategory(): string | null;
    /**
     * Get the timestamp value from a Timestamp Variant UUID
     * @returns {number|null} Timestamp value in the stored precision (seconds for v1, milliseconds for v2+), or null if not a Timestamp Variant
     */
    getTimestamp(): number | null;
    /**
     * Convert UUID to string representation
     * @returns {string} UUID string with dashes
     */
    toString(): string;
    /**
     * Convert UUID to buffer
     * @returns {Uint8Array} UUID as a 16-byte copy: a Node Buffer (a Uint8Array subclass) in Node, a plain Uint8Array in environments without Buffer
     */
    toBuffer(): Uint8Array;
    /**
     * Return the primitive value of the UUID (string representation)
     * This allows UUIDs to be automatically converted to strings when used in string contexts
     * @returns {string} UUID string with dashes
     */
    valueOf(): string;
    /**
     * Convert UUID to JSON representation (as string)
     * @returns {string} UUID string with dashes
     */
    toJSON(): string;
    /**
     * Get the version/variant identifier (alias for version())
     * @returns {string|number|null} Version identifier
     * @deprecated Use .version() instead
     */
    getVariantIdentifier(): string | number | null;
    /**
     * Get detailed information about this UUID
     * @returns {object} UUID information object
     */
    getInfo(): object;
    /**
     * Handle type coercion for different contexts
     * @param {string} hint - Type hint ('string', 'number', or 'default')
     * @returns {string} UUID string representation
     */
    [Symbol.toPrimitive](hint: string): string;
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