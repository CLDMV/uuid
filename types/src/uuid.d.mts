/**
 * The byte container toBuffer() returns: a Buffer in Node, a plain Uint8Array elsewhere.
 * `#bytes-type` (package.json `imports`) resolves to a Buffer alias under the `node`
 * condition and to a Uint8Array alias otherwise.
 */
export type Bytes = import("#bytes-type").Bytes;
/**
 * Options shared by the RFC generators that can write into a caller-supplied buffer.
 */
export type RFCBufferOptions = {
    /**
     * - Buffer to write the UUID into; when given, the generator returns it instead of a string
     */
    buf?: Uint8Array<ArrayBufferLike> | undefined;
    /**
     * - Offset in `buf` to start writing at (default 0)
     */
    offset?: number | undefined;
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
 * The byte container toBuffer() returns: a Buffer in Node, a plain Uint8Array elsewhere.
 * `#bytes-type` (package.json `imports`) resolves to a Buffer alias under the `node`
 * condition and to a Uint8Array alias otherwise.
 * @typedef {import("#bytes-type").Bytes} Bytes
 */
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
     * Versions 1 and 3 store seconds, versions 2 and 4 store milliseconds. Versions 3 and 4 lay the magnitude out most significant bit first (byte order is chronological); versions 1 and 2 keep the legacy low-word-first layout.
     * @param {number|Date|null|undefined} timestamp - Timestamp value (null/undefined defaults to the current time)
     * @param {number} version - Version number (1 or 3 for seconds, 2 or 4 for milliseconds)
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
     * @param {number} version - Version number (1 or 3 for seconds, 2 or 4 for milliseconds)
     * @param {Uint8Array|null} [entropy] - Optional entropy for bits 79-127
     * @returns {UUID} New UUID instance
     */
    static timestamp(timestamp: number | Date | null | undefined, version: number, entropy?: Uint8Array | null): UUID;
    /**
     * Create a Timestamp Variant UUID in seconds (ultra-short alias)
     * Subvariant 00 - Timestamp-based identification (seconds precision). Mints version 3, the ordered layout; version 1 (legacy layout) is still decoded.
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
     * Create a Timestamp Variant UUID in milliseconds (ultra-short alias)
     * Subvariant 00 - Timestamp-based identification (milliseconds precision). Mints version 4, the ordered layout; version 2 (legacy layout) is still decoded.
     * @param {number|Date|null} [timestamp] - Timestamp value (optional, defaults to the current time)
     * @param {Uint8Array|null} [entropy] - Optional entropy for bits 79-127
     * @returns {UUID} New UUID instance
     */
    static TB(timestamp?: number | Date | null, entropy?: Uint8Array | null): UUID;
    /**
     * Build the `entropy` argument for `UUID.TA()` / `UUID.TB()` from an optional seed.
     * Fills the 49 entropy bits TA/TB keep (bits 79-127) with a per-tick counter (12 bits), the first 16 bits of SHA-1(seed) or random bits without a seed, and 21 random bits.
     * Two calls in one process on the same tick never return the same bytes. Stamp the id with the returned `.timestamp` to keep that across a tick boundary.
     * @param {import("./lib/entropy.mjs").EntropyOptions} [options] - Seed, precision ("ms" for TB, "s" for TA) and overflow handling
     * @returns {import("./lib/entropy.mjs").EntropyBytes} 16-byte array with the tick used as `.timestamp`
     * @example
     * const e = UUID.entropy({ seed: "rummage · main" });
     * const id = UUID.TB(e.timestamp, e);
     */
    static entropy(options?: import("./lib/entropy.mjs").EntropyOptions): import("./lib/entropy.mjs").EntropyBytes;
    /**
     * Rewrite a legacy timestamp id (version 1 or 2) into the ordered layout (version 3 or 4)
     * The sign, the timestamp value and the 49 entropy bits (bits 79-127) are carried over unchanged, so the mapping is deterministic: the same legacy id always migrates to the same new id. Ids already at version 3 or 4, and every non-timestamp UUID, come back as an equal copy. Throws only when the input cannot be parsed.
     * @param {UUID|string|Uint8Array} input - A UUID instance, a UUID string, or a 16-byte buffer
     * @returns {UUID} New UUID instance
     * @example
     * UUID.migrate("e7f2b400-0000-018b-e005-c289f23865d3").toString(); // version 2 -> version 4, same timestamp
     */
    static migrate(input: UUID | string | Uint8Array): UUID;
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
    static v1(options?: (RFCBufferOptions & {
        node?: ArrayLike<number>;
        clockseq?: number;
        msecs?: number;
        nsecs?: number;
    } & {
        buf?: undefined;
    }) | undefined): string;
    /**
     * Generate a version 1 (timestamp) UUID, written into `options.buf`
     * @template {Uint8Array} T
     * @overload
     * @param {TimeOptions & { buf: T }} options - Options with the buffer to write into
     * @returns {T} `options.buf` itself, so its type is kept (a Buffer stays a Buffer)
     */
    static v1<T extends Uint8Array>(options: TimeOptions & {
        buf: T;
    }): T;
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
    static v4(options?: (RFCBufferOptions & {
        random?: Uint8Array;
    } & {
        buf?: undefined;
    }) | undefined): string;
    /**
     * Generate a version 4 (random) UUID, written into `options.buf`
     * @template {Uint8Array} T
     * @overload
     * @param {V4Options & { buf: T }} options - Options with the buffer to write into
     * @returns {T} `options.buf` itself, so its type is kept (a Buffer stays a Buffer)
     */
    static v4<T extends Uint8Array>(options: V4Options & {
        buf: T;
    }): T;
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
    static v6(options?: (RFCBufferOptions & {
        node?: ArrayLike<number>;
        clockseq?: number;
        msecs?: number;
        nsecs?: number;
    } & {
        buf?: undefined;
    }) | undefined): string;
    /**
     * Generate a version 6 (timestamp, reordered) UUID, written into `options.buf`
     * @template {Uint8Array} T
     * @overload
     * @param {TimeOptions & { buf: T }} options - Options with the buffer to write into
     * @returns {T} `options.buf` itself, so its type is kept (a Buffer stays a Buffer)
     */
    static v6<T extends Uint8Array>(options: TimeOptions & {
        buf: T;
    }): T;
    /**
     * Generate a version 7 (Unix Epoch) UUID
     * @overload
     * @param {V7Options & { buf?: undefined }} [options] - Optional parameters
     * @returns {string} UUID string
     */
    static v7(options?: (RFCBufferOptions & {
        msecs?: number;
    } & {
        buf?: undefined;
    }) | undefined): string;
    /**
     * Generate a version 7 (Unix Epoch) UUID, written into `options.buf`
     * @template {Uint8Array} T
     * @overload
     * @param {V7Options & { buf: T }} options - Options with the buffer to write into
     * @returns {T} `options.buf` itself, so its type is kept (a Buffer stays a Buffer)
     */
    static v7<T extends Uint8Array>(options: V7Options & {
        buf: T;
    }): T;
    /**
     * Generate a version 8 (custom/experimental) UUID
     * @overload
     * @param {V8Options & { buf?: undefined }} [options] - Optional parameters
     * @returns {string} UUID string
     */
    static v8(options?: (RFCBufferOptions & {
        data?: Uint8Array;
    } & {
        buf?: undefined;
    }) | undefined): string;
    /**
     * Generate a version 8 (custom/experimental) UUID, written into `options.buf`
     * @template {Uint8Array} T
     * @overload
     * @param {V8Options & { buf: T }} options - Options with the buffer to write into
     * @returns {T} `options.buf` itself, so its type is kept (a Buffer stays a Buffer)
     */
    static v8<T extends Uint8Array>(options: V8Options & {
        buf: T;
    }): T;
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
     * @param {number} timestampValue - Timestamp value (in seconds for versions 1 and 3, milliseconds for versions 2 and 4)
     * @param {boolean} [ordered] - True for the ordered layout (versions 3 and 4), false for the legacy layout (versions 1 and 2)
     * @private
     */
    private _setTimestamp;
    /**
     * Write the 69-bit stored magnitude (already in negative-ordering form) into segment A (bits 1-63) and bits 69-74
     * @param {bigint} storedMagnitude - Stored 69-bit magnitude
     * @param {boolean} ordered - True for the ordered layout (versions 3 and 4), false for the legacy layout (versions 1 and 2)
     * @private
     */
    private _setStoredMagnitude;
    /**
     * Read the 69-bit stored magnitude (negative-ordering form) from segment A and bits 69-74, choosing the layout by version
     * @returns {bigint} Stored 69-bit magnitude
     * @private
     */
    private _getStoredMagnitude;
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
     * uuid.version(); // => "TA" for Timestamp v3 (and legacy v1)
     * uuid.version(); // => "TB" for Timestamp v4 (and legacy v2)
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
     * Check whether this is a Timestamp Variant UUID in the legacy low-word-first layout (versions 1 and 2)
     * Select stored ids to rewrite with {@link UUID.migrate}.
     * @returns {boolean} True for timestamp-variant versions 1 and 2
     */
    isLegacyTimestampLayout(): boolean;
    /**
     * Get the timestamp value from a Timestamp Variant UUID
     * @returns {number|null} Timestamp value in the stored precision (seconds for versions 1 and 3, milliseconds for versions 2 and 4), or null if not a Timestamp Variant
     */
    getTimestamp(): number | null;
    /**
     * Convert UUID to string representation
     * @returns {string} UUID string with dashes
     */
    toString(): string;
    /**
     * Convert UUID to buffer
     * @returns {Bytes} UUID as a 16-byte copy: a Node Buffer (a Uint8Array subclass) in Node, a plain Uint8Array in environments without Buffer
     */
    toBuffer(): Bytes;
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
     * @returns {string} UUID string representation
     */
    [Symbol.toPrimitive](): string;
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