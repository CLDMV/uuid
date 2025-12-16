# @cldmv/uuid

Extended RFC 4122 and RFC 9562 UUID implementation with custom variant structures, issuer-based identification, and timestamp variants.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.12-brightgreen.svg)](https://nodejs.org)

## Features

- ✅ **Full RFC 4122 & RFC 9562 Support**: v1, v3, v4, v5, v6, v7 UUIDs
- 🔧 **Custom UUID Variants**: Issuer-based and timestamp-based identification systems
- 🎯 **Type-Safe**: ESM-first with TypeScript definitions
- ⚡ **High Performance**: Optimized bit manipulation and entropy generation
- 🔒 **Collision-Resistant**: Proper entropy validation and distribution
- 📦 **Zero Dependencies**: No external runtime dependencies
- 🧪 **Well-Tested**: Comprehensive test coverage (155+ tests)

## Installation

```bash
npm install @cldmv/uuid
```

## Quick Start

### RFC Standard UUIDs

```javascript
import { UUID } from "@cldmv/uuid";

// Generate different UUID versions
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

### Custom UUID Variants

```javascript
import { UUID } from "@cldmv/uuid";

// Create issuer-based UUID (multiple naming options)
const issuerUUID = UUID.IA(404); // Ultra-short: Issuer v1
const issuerUUID2 = UUID.issuer(404, 1); // Short: explicit version
const issuerUUID3 = UUID.createIssuerVariant(404, 1); // Full name

// Create timestamp-based UUID (timestamp defaults to Date.now())
const timestampUUID = UUID.TA(); // Ultra-short: Timestamp v1 (seconds), current time
const timestampUUID2 = UUID.TB(); // Ultra-short: Timestamp v2 (milliseconds), current time
const timestampUUID3 = UUID.TA(Date.now()); // Explicit timestamp
const timestampUUID4 = UUID.timestamp(Date.now(), 1); // Short: explicit version
const timestampUUID5 = UUID.createTimestampVariant(Date.now(), 1); // Full name

// Parse and inspect
console.log(issuerUUID.toString());
console.log(issuerUUID.getInfo());
```

## API Reference

### RFC UUID Methods

#### Version Generators

##### `UUID.v1([options])`

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

##### `UUID.v3(name, namespace)`

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

### Custom UUID Methods

Custom UUIDs have multiple naming conventions for convenience:

- **Ultra-short**: `UUID.TA()`, `UUID.TB()`, `UUID.IA()` - Version-specific shortcuts
- **Short**: `UUID.timestamp()`, `UUID.issuer()` - Explicit version parameter
- **Full**: `UUID.createTimestampVariant()`, `UUID.createIssuerVariant()` - Complete method names

#### Ultra-Short Version-Specific Shortcuts

##### `UUID.TA(timestamp, entropy)`

**Timestamp Variant v1** - Seconds precision (Subvariant 00)

**Parameters:**

- `timestamp` (number|Date, optional): Timestamp value (signed 70-bit). Defaults to `Date.now()`
- `entropy` (Buffer, optional): Custom entropy data

**Returns:** UUID instance

```javascript
const uuid = UUID.TA(); // Current time, seconds precision
const uuid2 = UUID.TA(Date.now()); // Explicit timestamp
```

##### `UUID.TB(timestamp, entropy)`

**Timestamp Variant v2** - Milliseconds precision (Subvariant 00)

**Parameters:**

- `timestamp` (number|Date, optional): Timestamp value (signed 70-bit). Defaults to `Date.now()`
- `entropy` (Buffer, optional): Custom entropy data

**Returns:** UUID instance

```javascript
const uuid = UUID.TB(); // Current time, milliseconds precision
const uuid2 = UUID.TB(Date.now()); // Explicit timestamp
```

##### `UUID.IA(issuerID, entropy)`

**Issuer Variant v1** (Subvariant 01)

**Parameters:**

- `issuerID` (number): Issuer ID (0-1023)
  - 0: Unassigned/Open
  - 1: Drafter Reserved
  - 2-255: Category A (Well-Recognized Technology Entities)
  - 256-511: Category B (Open Source Ecosystem Contributors)
  - 404: Spec Originator Reserved
  - 512-1023: Future RFC expansion
- `entropy` (Buffer, optional): Custom entropy data

**Returns:** UUID instance

```javascript
const uuid = UUID.IA(404); // Issuer v1
```

#### Full Methods with Explicit Versions

##### `UUID.timestamp(timestamp, version, entropy)` / `UUID.createTimestampVariant(...)`

Create a UUID with timestamp-based identification.

**Parameters:**

- `timestamp` (number|Date, optional): Timestamp in milliseconds (signed 70-bit). Defaults to `Date.now()`
- `version` (number): Version number (1=seconds, 2=milliseconds)
- `entropy` (Buffer, optional): Custom entropy data

**Returns:** UUID instance

```javascript
const uuid1 = UUID.timestamp(Date.now(), 1); // Seconds
const uuid2 = UUID.timestamp(Date.now(), 2); // Milliseconds
const uuid3 = UUID.createTimestampVariant(Date.now(), 2); // Full name
```

##### `UUID.issuer(issuerID, version, entropy)` / `UUID.createIssuerVariant(...)`

Create a UUID with issuer-based identification.

**Parameters:**

- `issuerID` (number): Issuer ID (0-1023)
- `version` (number): Version number (4 bits)
- `entropy` (Buffer, optional): Custom entropy data

**Returns:** UUID instance

```javascript
const uuid1 = UUID.issuer(404, 1);
const uuid2 = UUID.createIssuerVariant(404, 1); // Full name
```

#### Instance Methods

##### `uuid.toString()`

Get UUID as hyphenated string.

```javascript
const str = uuid.toString();
// => 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
```

##### `uuid.toBuffer()`

Get UUID as Buffer.

```javascript
const buffer = uuid.toBuffer();
```

##### `uuid.getInfo()`

Get detailed information about the UUID.

```javascript
const info = uuid.getInfo();
// {
//   variant: 7,
//   subvariant: 1,
//   version: 1,
//   issuerID: 404,
//   isUUID: true,
//   ...
// }
```

##### `uuid.isIssuerVariant()`

Check if UUID is an issuer variant.

```javascript
const isIssuer = uuid.isIssuerVariant();
```

##### `uuid.isTimestampVariant()`

Check if UUID is a timestamp variant.

```javascript
const isTimestamp = uuid.isTimestampVariant();
```

### Validation Methods

#### `UUID.validate(buffer)`

Validate custom UUID buffer for specification compliance.

```javascript
const result = await UUID.validate(buffer);
// {
//   valid: true,
//   variant: 7,
//   subvariant: 1,
//   version: 1,
//   ...
// }
```

#### `UUID.validateDetailed(buffer)`

Generate complete validation report for a UUID.

```javascript
const report = await UUID.validateDetailed(buffer);
```

### Registry Methods

#### `UUID.registerIssuerA(issuerID, name, description)`

Register a new issuer in Category A (IDs 2-255).

```javascript
await UUID.registerIssuerA(100, "Example Corp", "Technology company");
```

#### `UUID.registerIssuerB(issuerID, name, description)`

Register a new issuer in Category B (IDs 256-511).

```javascript
await UUID.registerIssuerB(300, "Open Project", "Open source project");
```

#### `UUID.getIssuerInfo(issuerID)`

Get issuer information by ID.

```javascript
const info = await UUID.getIssuerInfo(404);
```

## UUID Specification

### Custom Variant Structure

The custom UUID specification extends RFC 4122 with new variant structures:

#### Bit Layout

- **Bits 0-63**: Time/data fields (variant-specific)
- **Bits 64-66**: Variant (111 for custom namespace)
- **Bits 67-68**: Subvariant
  - `00`: Timestamp Variant
  - `01`: Issuer Variant
  - `10`: Reserved
  - `11`: Reserved
- **Bits 69-74**: Reserved/continuation (version-dependent)
- **Bits 75-78**: Version (4 bits)
- **Bits 79-87**: Issuer ID (10 bits, Issuer Variant only)
- **Bits 88-127**: Entropy/reserved

### Issuer Categories

- **Category 0**: Unassigned/Open (ID: 0)
- **Category 1**: Drafter Reserved (ID: 1)
- **Category A**: Well-Recognized Technology Entities (IDs: 2-255)
- **Category B**: Open Source Ecosystem Contributors (IDs: 256-511)
- **Special**: Spec Originator Reserved (ID: 404)
- **Future**: RFC Expansion (IDs: 512-1023)

### Timestamp Variant

Uses a signed 70-bit timestamp layout:

- **Bit 0**: Sign bit (0=negative, 1=positive)
- **Bits 1-63**: Lower 63 bits of timestamp magnitude
- Preserves lexicographic sort order
- Supports Version 1 (seconds) and Version 2 (milliseconds)

## Examples

### Generate Multiple UUID Versions

```javascript
import { UUID } from "@cldmv/uuid";

// RFC standard versions
const uuids = {
	v1: UUID.v1(),
	v3: UUID.v3("example.com", UUID.DNS),
	v4: UUID.v4(),
	v5: UUID.v5("example.com", UUID.DNS),
	v6: UUID.v6(),
	v7: UUID.v7()
};

console.log("Generated UUIDs:", uuids);
```

### Deterministic UUID Generation

```javascript
// Same input always generates same UUID
const uuid1 = UUID.v5("hello", UUID.DNS);
const uuid2 = UUID.v5("hello", UUID.DNS);

console.log(uuid1 === uuid2); // true
```

### Sortable UUIDs

```javascript
// v7 UUIDs are lexicographically sortable
const uuids = [UUID.v7({ msecs: Date.now() }), UUID.v7({ msecs: Date.now() + 1000 }), UUID.v7({ msecs: Date.now() + 2000 })];

const sorted = uuids.sort();
console.log("Chronological order:", sorted);
```

### Custom Issuer UUID

```javascript
// Create UUID with issuer identification (ultra-short syntax)
const myAppUUID = UUID.IA(404); // Spec originator reserved ID, v1

console.log("UUID:", myAppUUID.toString());
console.log("Info:", myAppUUID.getInfo());
console.log("Is Issuer Variant:", myAppUUID.isIssuerVariant());
```

### Timestamp-based UUID

```javascript
// Create timestamp-based UUID (ultra-short syntax)
const timeUUID1 = UUID.TA(); // v1: seconds precision, current time
const timeUUID2 = UUID.TB(); // v2: milliseconds precision, current time

console.log("UUID v1:", timeUUID1.toString());
console.log("UUID v2:", timeUUID2.toString());
console.log("Info:", timeUUID2.getInfo());
```

### Validation and Parsing

```javascript
const uuid = UUID.v4();

// Validate format
if (UUID.validateRFC(uuid)) {
	// Parse to bytes
	const bytes = UUID.parse(uuid);

	// Convert back to string
	const reconstructed = UUID.stringify(bytes);

	// Check version
	const version = UUID.version(uuid);

	console.log("Valid UUID v" + version);
	console.log("Bytes:", bytes);
	console.log("Reconstructed:", reconstructed);
}
```

## Performance

The library is optimized for high-performance UUID generation:

- **v4 Generation**: ~90,000+ UUIDs/second
- **v7 Generation**: ~95,000+ UUIDs/second
- **Zero Collisions**: Tested with 100,000+ UUID generation runs
- **Efficient Bit Operations**: Direct bit manipulation without string conversions
- **Cryptographically Secure**: Uses Node.js crypto.randomBytes()

## Development

### Running Tests

```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

### Test Coverage

- 155+ comprehensive tests
- RFC UUID compliance tests
- Custom variant validation tests
- Collision resistance tests
- Integration tests

## TypeScript Support

Full TypeScript definitions included:

```typescript
import { UUID } from "@cldmv/uuid";

const uuid: string = UUID.v4();
const bytes: Uint8Array = UUID.parse(uuid);
const version: number | null = UUID.version(uuid);
```

## License

Apache-2.0 © [CLDMV](https://github.com/CLDMV)

## Contributing

Contributions welcome! Please read the [contributing guidelines](CONTRIBUTING.md) first.

## Support

- 🐛 [Report Issues](https://github.com/CLDMV/uuid/issues)
- 💬 [Discussions](https://github.com/CLDMV/uuid/discussions)
- 💰 [Sponsor](https://github.com/sponsors/shinrai)

## Related Projects

- [uuid](https://www.npmjs.com/package/uuid) - Standard RFC 4122 UUID implementation
- [ulid](https://www.npmjs.com/package/ulid) - Universally Unique Lexicographically Sortable Identifier

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

Made with ❤️ by [CLDMV](https://cldmv.net)
