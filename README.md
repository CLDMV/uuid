# @cldmv/uuid

Extended UUID specification designed for RFC inclusion, formally extending RFC 4122/9562 with custom variant structures for issuer-based identification and enhanced timestamp variants.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.12-brightgreen.svg)](https://nodejs.org)

## Overview

This library implements a **new UUID specification** that formally extends the RFC 4122/9562 namespace with:

- **Custom Variant Structure (111)**: Entry into extended namespace via bits 64-66
- **Subvariant System**: Timestamp (00) and Issuer (01) branches with reserved expansion slots
- **Issuer-Based Identification**: 10-bit issuer ID system with categorized allocation ranges
- **Enhanced Timestamp Variants**: Signed 70-bit timestamps supporting pre-epoch dates with proper lexicographic ordering
- **Formal Bit Layout**: Precisely specified field positions maintaining RFC compatibility

The specification is designed for formal RFC submission and includes comprehensive implementation details, entropy requirements, and collision resistance analysis.

## Features

- 🆕 **RFC-Ready Specification**: Extended variant (111) with formal bit layout and entropy analysis
- 🔧 **Issuer Variant**: 10-bit ID space (0-1023) with categorized allocation (Technology, Open Source, Reserved)
- ⏱️ **Timestamp Variants**: Signed 70-bit timestamps (TA=seconds, TB=milliseconds) with negative timestamp support
- 🎯 **Type-Safe**: ESM-first with complete TypeScript definitions
- ⚡ **High Performance**: Optimized bit manipulation, 90K+ UUIDs/sec
- 🔒 **Collision-Resistant**: Cryptographic entropy sources with validation
- 📦 **Zero Dependencies**: No external runtime dependencies
- 🧪 **Thoroughly Tested**: 170+ tests covering all specification requirements
- ✅ **Bonus: RFC Support**: Complete v1/v3/v4/v5/v6/v7 implementation included

## Installation

```bash
npm install @cldmv/uuid
```

## Quick Start

### Custom UUID Variants (RFC Specification)

The primary focus of this library is the new custom UUID specification designed for RFC submission:

```javascript
import { UUID } from "@cldmv/uuid";

// TA: Timestamp Variant v1 (seconds precision, subvariant 00)
const taUUID = UUID.TA(); // Current time in seconds
const taWithTime = UUID.TA(Math.floor(Date.now() / 1000)); // Explicit timestamp
const taNegative = UUID.TA(-60); // 60 seconds before Unix epoch

// TB: Timestamp Variant v2 (milliseconds precision, subvariant 00)
const tbUUID = UUID.TB(); // Current time in milliseconds
const tbWithTime = UUID.TB(Date.now()); // Explicit timestamp
const tbNegative = UUID.TB(-315619200000); // January 1, 1960

// IA: Issuer Variant v1 (subvariant 01)
const iaUUID = UUID.IA(404); // Spec Originator Reserved ID
const iaOpen = UUID.IA(0); // Unassigned/Open
const iaTech = UUID.IA(100); // Category A (Well-Recognized Technology)
const iaOSS = UUID.IA(300); // Category B (Open Source Ecosystem)

// Extract specification-compliant data
const info = taUUID.getInfo();
console.log(info);
// {
//   variant: 7,          // bits 64-66: 111 (custom namespace)
//   subvariant: 0,       // bits 67-68: 00 (Timestamp Variant)
//   version: 1,          // bits 75-78: 0001 (v1 = seconds)
//   timestamp: 1766203054, // signed 70-bit timestamp
//   isCustomUUID: true,
//   isTimestampVariant: true,
//   issuerID: null,      // null for Timestamp Variants
//   issuerCategory: null
// }

const iaInfo = iaUUID.getInfo();
console.log(iaInfo);
// {
//   variant: 7,          // bits 64-66: 111 (custom namespace)
//   subvariant: 1,       // bits 67-68: 01 (Issuer Variant)
//   version: 1,          // bits 75-78: 0001
//   issuerID: 404,       // bits 79-88: 10-bit issuer ID
//   issuerCategory: "Spec Originator",
//   isCustomUUID: true,
//   isIssuerVariant: true,
//   timestamp: null      // null for Issuer Variants
// }
```

### Standard RFC UUIDs (Bonus Feature)

```javascript
import { UUID } from "@cldmv/uuid";

// Generate RFC 4122/9562 standard UUIDs
const v1 = UUID.v1(); // Timestamp-based
const v4 = UUID.v4(); // Random
const v7 = UUID.v7(); // Unix Epoch (sortable)

// Namespace-based (deterministic)
const v5 = UUID.v5("hello.example.com", UUID.DNS);

// Validate and parse
if (UUID.validateRFC(v4)) {
	const bytes = UUID.parse(v4);
	const version = UUID.version(v4);
}
```

## Default String Representation

UUIDs automatically convert to strings when used in string contexts. This provides a seamless developer experience:

```javascript
import { UUID } from "@cldmv/uuid";

const uuid = UUID.TA();

// Direct usage - automatically converts to string
console.log(uuid); // a454aa7f-8000-019b-e003-cd2480cc8b40
console.log("UUID: " + uuid); // UUID: a454aa7f-8000-019b-e003-cd2480cc8b40
console.log(`UUID: ${uuid}`); // UUID: a454aa7f-8000-019b-e003-cd2480cc8b40

// JSON serialization - automatically converts to string
const obj = { id: uuid };
JSON.stringify(obj); // {"id":"a454aa7f-8000-019b-e003-cd2480cc8b40"}

// Comparisons work as expected
uuid == uuid.toString(); // true
uuid.valueOf() === uuid.toString(); // true

// Get buffer when needed
const buffer = uuid.toBuffer(); // <Buffer a4 54 aa 7f 80 00 01 9b e0 03 cd 24 80 cc 8b 40>
```

The UUID class implements `valueOf()`, `Symbol.toPrimitive`, and `toJSON()` to ensure proper string coercion in all contexts. Use `toBuffer()` when you explicitly need the raw binary representation.

## API Reference

### Custom UUID Specification Methods

The core API for the RFC-ready custom UUID specification.

#### Ultra-Short Variant-Specific Methods

##### `UUID.TA([timestamp], [entropy])`

**Timestamp Variant v1** - Seconds precision (Subvariant 00)

Creates a UUID with a signed 70-bit timestamp in **seconds** from Unix epoch. Supports negative timestamps for dates before January 1, 1970.

**Parameters:**

- `timestamp` (number|Date, optional): Timestamp in **seconds**. Defaults to `Math.floor(Date.now() / 1000)`
- `entropy` (Buffer, optional): Custom entropy data (optional bits)

**Returns:** UUID instance

**Bit Layout:**

- Bits 0: Sign bit (0=negative, 1=positive)
- Bits 1-63: Lower 63 bits of timestamp magnitude
- Bits 64-66: Variant = `111` (custom namespace)
- Bits 67-68: Subvariant = `00` (Timestamp Variant)
- Bits 69-74: Timestamp continuation (upper 6 bits)
- Bits 75-78: Version = `0001` (v1 = seconds)
- Bits 79-127: Entropy (49 bits)

```javascript
const uuid = UUID.TA(); // Current time (seconds)
const uuid2 = UUID.TA(1766203054); // Explicit timestamp (seconds)
const uuid3 = UUID.TA(-60); // 60 seconds before epoch

// Extract timestamp
const timestamp = uuid.getTimestamp(); // Returns seconds
const date = new Date(timestamp * 1000); // Convert to Date
```

##### `UUID.TB([timestamp], [entropy])`

**Timestamp Variant v2** - Milliseconds precision (Subvariant 00)

Creates a UUID with a signed 70-bit timestamp in **milliseconds** from Unix epoch. Supports negative timestamps for dates before January 1, 1970.

**Parameters:**

- `timestamp` (number|Date, optional): Timestamp in **milliseconds**. Defaults to `Date.now()`
- `entropy` (Buffer, optional): Custom entropy data (optional bits)

**Returns:** UUID instance

**Bit Layout:**

- Bits 0: Sign bit (0=negative, 1=positive)
- Bits 1-63: Lower 63 bits of timestamp magnitude
- Bits 64-66: Variant = `111` (custom namespace)
- Bits 67-68: Subvariant = `00` (Timestamp Variant)
- Bits 69-74: Timestamp continuation (upper 6 bits)
- Bits 75-78: Version = `0010` (v2 = milliseconds)
- Bits 79-127: Entropy (49 bits)

```javascript
const uuid = UUID.TB(); // Current time (milliseconds)
const uuid2 = UUID.TB(1766203054902); // Explicit timestamp (ms)
const uuid3 = UUID.TB(-315619200000); // January 1, 1960

// Extract timestamp
const timestamp = uuid.getTimestamp(); // Returns milliseconds
const date = new Date(timestamp); // Convert to Date
```

##### `UUID.IA(issuerID, [entropy])`

**Issuer Variant v1** (Subvariant 01)

Creates a UUID with a 10-bit issuer identification field. The issuer ID space (0-1023) is divided into categorized allocation ranges.

**Parameters:**

- `issuerID` (number): Issuer ID (0-1023, required)
  - **0**: Unassigned/Open
  - **1**: Drafter Reserved
  - **2-255**: Category A (Well-Recognized Technology Entities)
  - **256-511**: Category B (Open Source Ecosystem Contributors)
  - **404**: Spec Originator Reserved
  - **512-1023**: Future RFC expansion (≥16 ID blocks)
- `entropy` (Buffer, optional): Custom entropy data (optional bits)

**Returns:** UUID instance

**Bit Layout:**

- Bits 0-63: Random data / application-specific
- Bits 64-66: Variant = `111` (custom namespace)
- Bits 67-68: Subvariant = `01` (Issuer Variant)
- Bits 69-74: Reserved for version-specific use
- Bits 75-78: Version = `0001` (v1)
- Bits 79-88: Issuer ID (10 bits)
- Bits 89-127: Entropy (39 bits)

```javascript
const uuid = UUID.IA(404); // Spec Originator
const uuid2 = UUID.IA(0); // Unassigned/Open
const uuid3 = UUID.IA(100); // Category A

// Extract issuer information
const issuerID = uuid.getIssuerID(); // Returns 404
const category = uuid.getIssuerCategory(); // Returns "Spec Originator"
```

#### Alternative Naming Conventions

The custom UUID methods support multiple naming styles for developer convenience:

```javascript
// Ultra-short (recommended)
UUID.TA(); // Timestamp v1
UUID.TB(); // Timestamp v2
UUID.IA(404); // Issuer v1

// Short form with explicit version
UUID.timestamp(Math.floor(Date.now() / 1000), 1); // TA equivalent
UUID.timestamp(Date.now(), 2); // TB equivalent
UUID.issuer(404, 1); // IA equivalent

// Full method names
UUID.createTimestampVariant(Date.now(), 2);
UUID.createIssuerVariant(404, 1);
```

#### Instance Methods for Custom UUIDs

##### `uuid.toString()`

Get UUID as standard hyphenated string format.

**Note:** UUIDs automatically convert to strings in string contexts, so explicitly calling `toString()` is usually not necessary.

```javascript
const str = uuid.toString();
// => '9cf3cd36-8000-019b-e002-6009483ccba3'

// Automatic string conversion (no need to call toString)
console.log(uuid); // Same output
console.log(`UUID: ${uuid}`); // Same output
```

##### `uuid.toBuffer()`

Get UUID as 16-byte Buffer for binary operations.

```javascript
const buffer = uuid.toBuffer();
// => <Buffer 9c f3 cd 36 80 00 01 9b e0 02 60 09 48 3c cb a3>
```

##### `uuid.valueOf()`

Returns the string representation of the UUID. This method enables automatic string coercion.

```javascript
const value = uuid.valueOf();
// => '9cf3cd36-8000-019b-e002-6009483ccba3'

// Enables automatic coercion
String(uuid); // Same as uuid.valueOf()
uuid + ""; // Same as uuid.valueOf()
```

##### `uuid.toJSON()`

Returns the string representation for JSON serialization.

```javascript
const obj = { id: uuid };
JSON.stringify(obj);
// => '{"id":"9cf3cd36-8000-019b-e002-6009483ccba3"}'
```

##### `uuid.getInfo()`

Get complete specification-compliant information about the UUID.

```javascript
const info = uuid.getInfo();
// For Timestamp Variant (TA/TB):
// {
//   variant: 7,              // bits 64-66
//   subvariant: 0,           // bits 67-68
//   version: 1,              // bits 75-78
//   timestamp: 1766203054,   // signed 70-bit value
//   isCustomUUID: true,
//   isTimestampVariant: true,
//   issuerID: null,
//   issuerCategory: null
// }

// For Issuer Variant (IA):
// {
//   variant: 7,              // bits 64-66
//   subvariant: 1,           // bits 67-68
//   version: 1,              // bits 75-78
//   issuerID: 404,           // bits 79-88
//   issuerCategory: "Spec Originator",
//   isCustomUUID: true,
//   isIssuerVariant: true,
//   timestamp: null
// }
```

##### `uuid.getVariant()`

Get variant value (bits 64-66). Returns `7` (binary `111`) for custom UUIDs.

```javascript
const variant = uuid.getVariant(); // => 7
```

##### `uuid.getSubvariant()`

Get subvariant value (bits 67-68).

```javascript
const subvariant = uuid.getSubvariant();
// => 0 (0b00) for Timestamp Variants (TA/TB)
// => 1 (0b01) for Issuer Variants (IA)
```

##### `uuid.getVersion()`

Get version value (bits 75-78).

```javascript
const version = uuid.getVersion();
// => 1 for TA or IA
// => 2 for TB
```

##### `uuid.getTimestamp()`

Extract timestamp from Timestamp Variants. Returns `null` for Issuer Variants.

```javascript
const ta = UUID.TA(1766203054); // Seconds
const timestamp = ta.getTimestamp(); // => 1766203054 (seconds)

const tb = UUID.TB(1766203054902); // Milliseconds
const timestamp2 = tb.getTimestamp(); // => 1766203054902 (milliseconds)

const ia = UUID.IA(404);
const timestamp3 = ia.getTimestamp(); // => null (Issuer Variant)
```

##### `uuid.getIssuerID()`

Get issuer ID from Issuer Variants (bits 79-88). Returns `null` for Timestamp Variants.

```javascript
const ia = UUID.IA(404);
const issuerID = ia.getIssuerID(); // => 404

const ta = UUID.TA();
const issuerID2 = ta.getIssuerID(); // => null (Timestamp Variant)
```

##### `uuid.getIssuerCategory()`

Get human-readable issuer category. Returns `null` for Timestamp Variants.

```javascript
const ia = UUID.IA(404);
const category = ia.getIssuerCategory(); // => "Spec Originator"

const ia2 = UUID.IA(100);
const category2 = ia2.getIssuerCategory(); // => "Category A: Well-Recognized Technology Entities"
```

##### `uuid.isCustomUUID()`

Check if UUID uses the custom variant (111).

```javascript
const isCustom = uuid.isCustomUUID(); // => true
```

##### `uuid.isTimestampVariant()`

Check if UUID is a Timestamp Variant (subvariant 00).

```javascript
const ta = UUID.TA();
const isTimestamp = ta.isTimestampVariant(); // => true

const ia = UUID.IA(404);
const isTimestamp2 = ia.isTimestampVariant(); // => false
```

##### `uuid.isIssuerVariant()`

Check if UUID is an Issuer Variant (subvariant 01).

```javascript
const ia = UUID.IA(404);
const isIssuer = ia.isIssuerVariant(); // => true

const ta = UUID.TA();
const isIssuer2 = ta.isIssuerVariant(); // => false
```

##### `uuid.getVariantIdentifier()`

Get a human-readable identifier for the UUID variant/version. Returns a string identifier for custom variants ("TA", "TB", "IA") or the RFC version number for standard UUIDs.

```javascript
const ta = UUID.TA();
ta.getVariantIdentifier(); // => "TA"

const tb = UUID.TB();
tb.getVariantIdentifier(); // => "TB"

const ia = UUID.IA(404);
ia.getVariantIdentifier(); // => "IA"

const v4 = UUID.v4();
v4.getVariantIdentifier(); // => 4

const v7 = UUID.v7();
v7.getVariantIdentifier(); // => 7
```

#### Static Detection Methods

##### `UUID.detectVariant(uuid)`

Detect the variant identifier from any UUID (string, buffer, or UUID instance). Returns a string identifier for custom variants or version number for RFC variants.

```javascript
// Custom variants return string identifiers
UUID.detectVariant("a454aa7f-8000-019b-e003-cd2480cc8b40"); // => "TA"
UUID.detectVariant(taUuid.toBuffer()); // => "TA"

// RFC variants return version numbers
UUID.detectVariant("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b"); // => 4
UUID.detectVariant("018da58e-42e0-7b67-9f36-8e7e5f5b9c38"); // => 7

// Works with UUID instances
UUID.detectVariant(UUID.IA(404)); // => "IA"
```

**Parameters:**
- `uuid` (string|Uint8Array|UUID): UUID to detect variant from

**Returns:** String identifier ("TA", "TB", "IA", etc.) or version number (1-8) for RFC UUIDs

### Standard RFC UUID Methods

Complete implementation of RFC 4122/9562 standard UUID versions (bonus feature).

#### Version Generators

Generate a version 1 (timestamp) UUID.

```javascript
const uuid = UUID.v1();
const customUuid = UUID.v1({
	msecs: Date.now(),
	nsecs: 0,
	clockseq: 0x1234,
	node: [0x01, 0x02, 0x03, 0x04, 0x05, 0x06]
});
```

#### Version Generators

##### `UUID.v1([options])`

Generate a version 3 (namespace with MD5) UUID.

```javascript
const uuid = UUID.v3("hello.example.com", UUID.DNS);
```

##### `UUID.v4([options])`

Generate a version 4 (random) UUID.

```javascript
const uuid = UUID.v4();
const customUuid = UUID.v4({ random: customRandomBytes });
```

##### `UUID.v5(name, namespace)`

Generate a version 5 (namespace with SHA-1) UUID.

```javascript
const uuid = UUID.v5("hello.example.com", UUID.DNS);
```

##### `UUID.v6([options])`

Generate a version 6 (reordered timestamp) UUID.

```javascript
const uuid = UUID.v6();
const customUuid = UUID.v6({ msecs: Date.now() });
```

##### `UUID.v7([options])`

Generate a version 7 (Unix Epoch time-based) UUID. Sortable and monotonic.

```javascript
const uuid = UUID.v7();
const customUuid = UUID.v7({ msecs: Date.now() });
```

##### `UUID.v8([options])`

Generate a version 8 (custom/experimental) UUID. Version 8 provides an RFC-compatible format for experimental or vendor-specific UUID formats. The only requirement is that variant and version bits are set correctly; all other bits can be filled with custom data.

```javascript
const uuid = UUID.v8(); // Random data
const customUuid = UUID.v8({ 
	data: new Uint8Array(16) // Your custom 16 bytes
});
```

**Parameters:**
- `options.data` (Uint8Array, optional): Custom 16-byte data to use. If not provided, uses cryptographically random bytes.
- `options.buf` (Uint8Array, optional): Buffer to write UUID into.
- `options.offset` (number, optional): Offset in buffer to start writing.

**Returns:** UUID string or buffer (if `options.buf` provided)

#### Utility Methods

##### `UUID.parse(uuid)`

Convert UUID string to byte array.

```javascript
const bytes = UUID.parse("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b");
// => Uint8Array(16) [110, 192, 189, 127, ...]
```

##### `UUID.stringify(bytes)`

Convert byte array to UUID string.

```javascript
const uuid = UUID.stringify(bytes);
// => '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b'
```

##### `UUID.validateRFC(uuid)`

Validate RFC UUID string format.

```javascript
const isValid = UUID.validateRFC("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b");
// => true
```

##### `UUID.version(uuid)`

Detect RFC version of a UUID.

```javascript
const version = UUID.version("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b");
// => 4
```

#### Constants

```javascript
UUID.NIL; // '00000000-0000-0000-0000-000000000000'
UUID.MAX; // 'ffffffff-ffff-ffff-ffff-ffffffffffff'

// Standard namespaces for v3/v5
UUID.DNS; // DNS namespace
UUID.URL; // URL namespace
UUID.OID; // ISO OID namespace
UUID.X500; // X.500 DN namespace
```

## Custom UUID Specification Details

### Formal Bit Layout

The custom UUID specification uses **variant 111** (bits 64-66) as the entry point into the extended namespace, maintaining full compatibility with RFC 4122/9562:

```
Bit Layout (128 bits total):
┌─────────────┬──────────┬───────────┬──────────┬─────────┬─────────────┬──────────┐
│   0-63      │  64-66   │   67-68   │  69-74   │  75-78  │   79-88     │  89-127  │
├─────────────┼──────────┼───────────┼──────────┼─────────┼─────────────┼──────────┤
│ Time/Data   │ Variant  │ Subvariant│ Reserved │ Version │ Issuer ID   │ Entropy  │
│             │  (111)   │  (00/01)  │          │         │ (Issuer V.) │          │
└─────────────┴──────────┴───────────┴──────────┴─────────┴─────────────┴──────────┘

Timestamp Variant (Subvariant 00):
- Bits 0: Sign bit (0=negative, 1=positive)
- Bits 1-63: Timestamp magnitude (lower 63 bits)
- Bits 64-66: Variant = 111
- Bits 67-68: Subvariant = 00
- Bits 69-74: Timestamp magnitude (upper 6 bits)
- Bits 75-78: Version (1=seconds, 2=milliseconds)
- Bits 79-127: Entropy (49 bits)

Issuer Variant (Subvariant 01):
- Bits 0-63: Random/application data
- Bits 64-66: Variant = 111
- Bits 67-68: Subvariant = 01
- Bits 69-74: Reserved (version-specific)
- Bits 75-78: Version
- Bits 79-88: Issuer ID (10 bits, 0-1023)
- Bits 89-127: Entropy (39 bits)
```

### Subvariant System

- **00** (Timestamp Variant): Time-based identification with signed 70-bit timestamps
- **01** (Issuer Variant): Organization/entity-based identification with 10-bit issuer space
- **10** (Reserved): Future specification expansion
- **11** (Reserved): Future specification expansion

### Issuer ID Allocation Ranges

The 10-bit issuer ID space (0-1023) is formally divided into categories:

| Range    | Category         | Description                                       | Status        |
| -------- | ---------------- | ------------------------------------------------- | ------------- |
| 0        | Unassigned/Open  | Available for open/unregistered use               | **Immutable** |
| 1        | Drafter Reserved | Reserved for specification drafter                | **Immutable** |
| 2-255    | Category A       | Well-Recognized Technology Entities               | Assignable    |
| 256-511  | Category B       | Open Source Ecosystem Contributors                | Assignable    |
| 404      | Spec Originator  | Reserved for specification originator             | **Immutable** |
| 512-1023 | Future RFC       | Reserved for future RFC expansion (≥16 ID blocks) | Reserved      |

**Immutable Allocations:** IDs 0, 1, and 404 are permanently reserved and cannot be reassigned.

### Timestamp Encoding

The timestamp variants use a **signed 70-bit representation** that maintains lexicographic sort order:

**Positive Timestamps** (after Unix epoch):

- Sign bit (bit 0) = 1
- Magnitude stored directly in bits 1-69

**Negative Timestamps** (before Unix epoch):

- Sign bit (bit 0) = 0
- Stored value = `(2^69 - 1) - abs(magnitude)`
- This ordering rule ensures negative timestamps sort correctly

**Example:**

```javascript
// January 1, 1960 (10 years before epoch)
const timestamp = -315619200000; // milliseconds
const uuid = UUID.TB(timestamp);

// The negative value is encoded to preserve sort order:
// - Sign bit = 0 (negative)
// - Stored = (2^69 - 1) - 315619200000
// - Extraction reverses: -(2^69 - stored)

const extracted = uuid.getTimestamp();
console.log(extracted === timestamp); // true
```

### Collision Resistance

**Timestamp Variants (49 bits entropy):**

- Birthday bound: 99.99% no collision probability at ~16.7M UUIDs
- Per-second generation capacity: Safe up to millions of UUIDs/second
- Cryptographically secure entropy source (Node.js crypto.randomBytes)

**Issuer Variants (39 bits entropy):**

- Birthday bound: 99.99% no collision probability at ~522K UUIDs
- Combined with issuer ID: Effective namespace isolation per issuer
- Suitable for distributed generation with known issuer assignment

### Version Layout

Version field (bits 75-78) is always positioned consistently across all subvariants:

**Timestamp Variant Versions:**

- **v1** (0001): Seconds precision from Unix epoch
- **v2** (0010): Milliseconds precision from Unix epoch
- **v3+**: Reserved for future timestamp precision variants

**Issuer Variant Versions:**

- **v1** (0001): Basic issuer identification
- **v2+**: Reserved for future issuer-based variants

## Examples

### Timestamp Variant Examples

```javascript
import { UUID } from "@cldmv/uuid";

// Current time (TA uses seconds, TB uses milliseconds)
const ta = UUID.TA(); // Defaults to Math.floor(Date.now() / 1000)
const tb = UUID.TB(); // Defaults to Date.now()

console.log("TA UUID:", ta.toString());
console.log("TB UUID:", tb.toString());

// Extract and display timestamps
const taTime = ta.getTimestamp(); // Returns seconds
const tbTime = tb.getTimestamp(); // Returns milliseconds

console.log("TA Timestamp (s):", taTime);
console.log("TA Date:", new Date(taTime * 1000).toISOString());

console.log("TB Timestamp (ms):", tbTime);
console.log("TB Date:", new Date(tbTime).toISOString());

// Historical dates (negative timestamps)
const historical = UUID.TB(-315619200000); // January 1, 1960
console.log("Historical UUID:", historical.toString());
console.log("Date:", new Date(historical.getTimestamp()).toUTCString());
// => Fri, 01 Jan 1960 00:00:00 GMT
```

### Issuer Variant Examples

```javascript
import { UUID } from "@cldmv/uuid";

// Generate UUIDs with different issuer categories
const specOriginator = UUID.IA(404);
const openUse = UUID.IA(0);
const techEntity = UUID.IA(100); // Category A
const ossProject = UUID.IA(300); // Category B

// Extract issuer information
console.log("Spec Originator:");
console.log("  ID:", specOriginator.getIssuerID()); // => 404
console.log("  Category:", specOriginator.getIssuerCategory());
// => "Spec Originator"

console.log("\nTechnology Entity:");
console.log("  ID:", techEntity.getIssuerID()); // => 100
console.log("  Category:", techEntity.getIssuerCategory());
// => "Category A: Well-Recognized Technology Entities"

// Validate variant structure
const info = specOriginator.getInfo();
console.log("\nFull Specification Data:");
console.log("  Variant (bits 64-66):", info.variant); // => 7 (111)
console.log("  Subvariant (bits 67-68):", info.subvariant); // => 1 (01)
console.log("  Version (bits 75-78):", info.version); // => 1
console.log("  Issuer ID (bits 79-88):", info.issuerID); // => 404
```

### Comparing Timestamp and Issuer Variants

```javascript
import { UUID } from "@cldmv/uuid";

const ta = UUID.TA();
const ia = UUID.IA(404);

console.log("TA Info:");
console.log("  Variant:", ta.getVariant()); // => 7 (111)
console.log("  Subvariant:", ta.getSubvariant()); // => 0 (00)
console.log("  Version:", ta.getVersion()); // => 1
console.log("  Is Timestamp Variant:", ta.isTimestampVariant()); // => true
console.log("  Is Issuer Variant:", ta.isIssuerVariant()); // => false
console.log("  Timestamp:", ta.getTimestamp()); // => number (seconds)
console.log("  Issuer ID:", ta.getIssuerID()); // => null

console.log("\nIA Info:");
console.log("  Variant:", ia.getVariant()); // => 7 (111)
console.log("  Subvariant:", ia.getSubvariant()); // => 1 (01)
console.log("  Version:", ia.getVersion()); // => 1
console.log("  Is Timestamp Variant:", ia.isTimestampVariant()); // => false
console.log("  Is Issuer Variant:", ia.isIssuerVariant()); // => true
console.log("  Timestamp:", ia.getTimestamp()); // => null
console.log("  Issuer ID:", ia.getIssuerID()); // => 404

// Both TA and TB share subvariant 00 (differ only in version)
const tb = UUID.TB();
console.log("\nSubvariant Relationships:");
console.log("  TA subvariant:", ta.getSubvariant()); // => 0
console.log("  TB subvariant:", tb.getSubvariant()); // => 0
console.log("  IA subvariant:", ia.getSubvariant()); // => 1
console.log("  TA version:", ta.getVersion()); // => 1 (seconds)
console.log("  TB version:", tb.getVersion()); // => 2 (milliseconds)
```

### Standard RFC UUID Examples

### Standard RFC UUID Examples

```javascript
import { UUID } from "@cldmv/uuid";

// RFC standard versions (bonus feature)
const uuids = {
	v1: UUID.v1(),
	v3: UUID.v3("example.com", UUID.DNS),
	v4: UUID.v4(),
	v5: UUID.v5("example.com", UUID.DNS),
	v6: UUID.v6(),
	v7: UUID.v7()
};

console.log("Generated RFC UUIDs:", uuids);

// Deterministic UUID generation
const uuid1 = UUID.v5("hello", UUID.DNS);
const uuid2 = UUID.v5("hello", UUID.DNS);
console.log(uuid1 === uuid2); // true

// Sortable UUIDs with v7
const sortable = [UUID.v7({ msecs: Date.now() }), UUID.v7({ msecs: Date.now() + 1000 }), UUID.v7({ msecs: Date.now() + 2000 })];
console.log("Chronological order:", sortable.sort());

// Validation and parsing
const v4 = UUID.v4();
if (UUID.validateRFC(v4)) {
	const bytes = UUID.parse(v4);
	const version = UUID.version(v4);
	console.log("Valid UUID v" + version);
}
```

## Performance

The library is optimized for high-performance UUID generation with collision resistance:

- **Custom UUID Generation**: ~90,000+ UUIDs/second
- **RFC v4 Generation**: ~90,000+ UUIDs/second
- **RFC v7 Generation**: ~95,000+ UUIDs/second
- **Zero Collisions**: Tested with 100,000+ UUID generation runs
- **Efficient Bit Operations**: Direct bit manipulation without string conversions
- **Cryptographically Secure**: Uses Node.js crypto.randomBytes() for entropy
- **Proper Entropy Validation**: All generated UUIDs validated for entropy quality

## Demonstration Script

See the custom UUID specification in action with a comprehensive human-readable demonstration:

```bash
npm run demo
```

This interactive demonstration script showcases the RFC-ready specification:

- **TA (Timestamp v1)**: Generates UUID with seconds precision, extracts timestamp
- **TB (Timestamp v2)**: Generates UUID with milliseconds precision, extracts timestamp
- **IA (Issuer v1)**: Generates UUID with issuer ID 404, shows issuer category
- **Bit Field Verification**: Displays all specification fields (variant, subvariant, version, issuer ID)
- **Negative Timestamps**: Demonstrates pre-epoch date support with proper encoding
- **Subvariant Relationships**: Confirms TA/TB share subvariant 00, IA uses 01
- **Uniqueness Testing**: Generates 10,000 of each variant, verifies no collisions
- **Roundtrip Validation**: Tests string/buffer conversion preserves all data

Example output excerpt:

```
════════════════════════════════════════════════════════════════════════════════
  UUID.TA() - Timestamp Variant v1 (Seconds Precision)
════════════════════════════════════════════════════════════════════════════════

Generated UUID:
  b4a30f57-0000-0000-e003-b9b0f01b1d06

Extracted Data:
  ✓ Variant (bits 64-66)     : 7 (expected: 7)
  ✓ Subvariant (bits 67-68)  : 0 (expected: 0)
  ✓ Version (bits 75-78)     : 1 (expected: 1)
  ✓ Is Timestamp Variant     : true (expected: true)

Timestamp Information:
  ✓ Extracted Timestamp (s)  : 1766203054 (expected: 1766203054)
  Human Readable           : Friday, December 19, 2025 at 07:57:34 PM PST
  ISO 8601                 : 2025-12-20T03:57:34.000Z
```

## Development & Testing

### Running Tests

```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

### Test Coverage

- **170+ comprehensive tests** covering the complete specification
- **Custom UUID Specification Tests:**
  - Bit layout validation (variant, subvariant, version positioning)
  - Timestamp extraction and roundtrip (positive and negative)
  - Issuer ID extraction and category mapping
  - Subvariant relationships (TA/TB share 00, IA uses 01)
  - Negative timestamp encoding and ordering
- **RFC UUID Compliance Tests** (v1, v3, v4, v5, v6, v7)
- **Collision Resistance Tests** (100K+ UUID generation)
- **Integration Tests** (entropy validation, format conversion)
- **Bit Manipulation Tests** (low-level operations)

All tests pass with 100% specification compliance.

## TypeScript Support

Full TypeScript definitions included for both custom and RFC UUID APIs:

```typescript
import { UUID } from "@cldmv/uuid";

// Custom UUID specification (RFC-ready)
const ta: string = UUID.TA();
const tb: string = UUID.TB();
const ia: string = UUID.IA(404);

// Instance methods with proper types
const uuid = new UUID(ta);
const variant: number = uuid.getVariant(); // 7
const subvariant: number = uuid.getSubvariant(); // 0 or 1
const version: number = uuid.getVersion();
const timestamp: number | null = uuid.getTimestamp(); // null for Issuer Variant
const issuerID: number | null = uuid.getIssuerID(); // null for Timestamp Variant
const category: string | null = uuid.getIssuerCategory();

// Standard RFC UUIDs
const v4: string = UUID.v4();
const bytes: Uint8Array = UUID.parse(v4);
const rfcVersion: number | null = UUID.version(v4);
```

## Specification Documentation

The complete formal specification is available in [uuid-spec.md](uuid-spec.md), including:

- Detailed bit layout diagrams
- Entropy requirement calculations (Birthday Bound analysis)
- Negative timestamp encoding algorithms
- Issuer ID allocation policies
- Version numbering conventions
- Collision resistance proofs
- RFC submission rationale

## License

Apache-2.0 © [CLDMV](https://github.com/CLDMV)

This specification and implementation are provided for RFC standardization consideration.

## Contributing

Contributions to the specification and implementation are welcome! This project aims for RFC standardization, so contributions should maintain:

- **Specification Compliance**: All changes must align with the formal specification
- **Backward Compatibility**: Immutable fields (variant, subvariant positions) cannot change
- **Comprehensive Testing**: New features require corresponding test coverage
- **Documentation**: Changes to the specification must update [uuid-spec.md](uuid-spec.md)

Please read the contributing guidelines before submitting pull requests.

## Support & Discussion

- 🐛 [Report Issues](https://github.com/CLDMV/uuid/issues)
- 💬 [Specification Discussions](https://github.com/CLDMV/uuid/discussions)
- 📖 [Full Specification Document](uuid-spec.md)
- 💰 [Sponsor Development](https://github.com/sponsors/shinrai)

## Related Projects & Standards

- **[RFC 4122](https://datatracker.ietf.org/doc/html/rfc4122)** - Original UUID specification
- **[RFC 9562](https://datatracker.ietf.org/doc/html/rfc9562)** - Updated UUID specification with v6, v7, v8
- **[uuid](https://www.npmjs.com/package/uuid)** - Standard RFC 4122 UUID implementation (Node.js)
- **[ulid](https://www.npmjs.com/package/ulid)** - Universally Unique Lexicographically Sortable Identifier

This specification extends the RFC namespace with custom variant 111, maintaining full compatibility with existing RFC 4122/9562 UUIDs.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and specification evolution.

---

**Specification Status**: Implementation complete, designed for RFC submission.

Made with ❤️ by [CLDMV](https://cldmv.net)
