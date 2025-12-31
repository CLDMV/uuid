/**
 * Create a version 1 (timestamp) UUID
 * @param {Object} options - Optional parameters
 * @param {Array} options.node - 6-byte node id (MAC address)
 * @param {number} options.clockseq - 14-bit clock sequence
 * @param {number} options.msecs - Timestamp in milliseconds since unix epoch
 * @param {number} options.nsecs - Additional 100-nanosecond intervals
 * @param {Uint8Array} options.buf - Buffer to write UUID into
 * @param {number} options.offset - Offset in buffer to start writing
 * @returns {string|Uint8Array} UUID string or buffer
 */
export function v1(options?: {
    node: any[];
    clockseq: number;
    msecs: number;
    nsecs: number;
    buf: Uint8Array;
    offset: number;
}): string | Uint8Array;
//# sourceMappingURL=v1.d.mts.map