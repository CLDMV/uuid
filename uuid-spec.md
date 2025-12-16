# Custom UUID Specification (Authoritative)

## Status of This Document

This document defines the authoritative specification for a custom UUID namespace
built on RFC 4122 and RFC 9562 variant compatibility. It contains both informative sections
(purpose, governance, intent) and normative sections (bit-exact rules that MUST be
implemented exactly).

Normative sections override all informal discussion.

---

## 1. Project Scope (Informative)

This project defines, documents, and governs a custom UUID specification that:

- Preserves RFC 4122 and RFC 9562 variant bit positions and prefix-matching behavior
- Introduces a custom namespace under RFC “reserved” variant `111`
- Defines two new UUID specifications:
  - Timestamp Variant (subvariant `00`)
  - Issuer Variant (subvariant `01`)
- Supports signed, sortable timestamps
- Provides long-term extensibility without breaking backward compatibility

This document serves as:

- The single authoritative technical reference
- Instruction text for automated agents
- The governance foundation for future extensions

---

## 2. Compatibility and Design Principles (Informative)

- RFC 4122 and RFC 9562 variant bit positions MUST NOT be moved.
- Variant identification MUST follow RFC prefix-matching rules.
- New semantics are introduced only within `variant = 111`.
- Certain fields are immutable in position and meaning and require explicit
  confirmation before modification.
- The specification prioritizes:
  - Stability
  - Lexicographic sortability
  - Clear issuer governance

---

## 3. Bit Numbering and Encoding Model (Normative)

### 3.1 Bit numbering

- A UUID is exactly 128 bits, numbered 0 through 127.
- Bit 0 is the most-significant bit (MSB).
- Bit 127 is the least-significant bit (LSB).
- UUIDs MUST be serialized in network byte order (big-endian):
  - Bits 0–7 → byte 0
  - Bits 8–15 → byte 1
  - …
  - Bits 120–127 → byte 15

No alternative bit numbering is permitted.

---

## 4. Variant Determination (Normative)

Variant identification MUST follow RFC 4122 and RFC 9562 prefix-matching semantics
using bits 64–66:

- If bit 64 = 0 → NCS UUID
- Else if bits 64–65 = 10 → RFC 4122 and RFC 9562 UUID
- Else if bits 64–66 = 110 → Microsoft GUID
- Else if bits 64–66 = 111 → Custom UUID Namespace (this specification)

This specification only defines UUIDs where:

- Bits 64–66 = 111

---

## 5. Custom Namespace Structure (Normative)

### 5.1 Variant field (Immutable)

- Bits 64–66 (3 bits)
- Value MUST be `111`

### 5.2 Subvariant field (Immutable)

- Bits 67–68 (2 bits)
- Values:
  - `00` → Timestamp Variant
  - `01` → Issuer Variant
  - `10` → Reserved
  - `11` → Reserved

---

## 6. Immutable Bit Fields (Normative)

The following fields are immutable in both position and meaning and MUST NOT be
moved or redefined without explicit confirmation:

- Variant: bits 64–66
- Subvariant: bits 67–68
- Version: bits 75–78
- Issuer ID: bits 79–88 (Issuer Variant only)

Reserved or undefined fields are not immutable.

---

## 7. Signed Timestamp Model (Normative)

All timestamp-based UUIDs use a 70-bit signed timestamp model.

### 7.1 Timestamp sign bit

- Bit 0 is the sign bit:
  - `0` = negative
  - `1` = positive

### 7.2 Timestamp magnitude

- The remaining 69 bits represent timestamp magnitude.
- Timestamp bits are split around the RFC variant/subvariant region.

### 7.3 Negative timestamp ordering rule

To preserve correct lexical and numeric ordering:

If the sign bit indicates a negative timestamp, the stored magnitude MUST be:

stored = (2^69 − 1) − abs(magnitude)

Positive timestamps are stored without modification.

This rule is mandatory.

---

## 8. Timestamp Variant (subvariant = 00) (Normative)

### 8.1 Bit layout

| Bit Range (Width) | Field                             | Notes                           |
| ----------------- | --------------------------------- | ------------------------------- |
| 0–63 (64)         | Timestamp segment A               | Includes sign bit at position 0 |
| 64–66 (3)         | Variant                           | Must be 111                     |
| 67–68 (2)         | Subvariant                        | Must be 00                      |
| 69–74 (6)         | Timestamp continuation / reserved | Version-dependent               |
| 75–78 (4)         | Version                           | Always starts at bit 75         |
| 79–127 (49)       | Entropy / reserved                | Version-dependent               |

### 8.2 Timestamp versions

Timestamp Version 1 — Seconds resolution:

    - Timestamp represents seconds from epoch.
    - Uses the 70-bit signed timestamp model.
    - Bits 69–74 and 79–127 are defined by the timestamp-v1 specification.

Timestamp Version 2 — Milliseconds resolution:

    - Timestamp represents milliseconds from epoch.
    - Uses the 70-bit signed timestamp model.
    - Bits 69–74 are currently undefined unless later specified.
    - Bits 79–127 are defined by the timestamp-v2 specification.

---

## 9. Issuer Variant (subvariant = 01) (Normative)

### 9.1 Bit layout

| Bit Range (Width) | Field                             | Notes                                   |
| ----------------- | --------------------------------- | --------------------------------------- |
| 0–63 (64)         | Timestamp segment A               | Includes sign bit at position 0         |
| 64–66 (3)         | Variant                           | Must be 111                             |
| 67–68 (2)         | Subvariant                        | Must be 01                              |
| 69–74 (6)         | Timestamp continuation / reserved | Version guideline                       |
| 75–78 (4)         | Version                           | Position immutable, guideline semantics |
| 79–88 (10)        | Issuer ID                         | Position immutable                      |
| 89–127 (39)       | Issuer-defined payload            | Not enforced by this spec               |

---

## 10. Issuer ID Policy (Normative)

### 10.1 Immutable issuer IDs

- Issuer ID 0 → Open / Null (immutable)
- Issuer ID 1 → Governance reserved (immutable)
- Issuer ID 404 → Spec originator reserved (immutable)

### 10.2 Predefined issuer ranges (locked)

- Category A: Well-Recognized Technology Entities
  - Issuer IDs 2–255
- Category B: Open Source Ecosystem Contributors
  - Issuer IDs 256–511
  - Issuer ID 404 lies in this range and is reserved

### 10.3 Future use range

- Issuer IDs 512–1023 are reserved.
- Any revision allocating from this range MUST allocate at least 16 IDs per revision unless accompanied by other substantial technical changes.

---

## 11. Entropy Requirements (Normative)

- Entropy MUST NOT be derived solely from the same clock used for timestamp generation.
- Acceptable sources include OS-provided cryptographically secure RNGs.
- Birthday-bound analysis MAY be used to size entropy.
- Collision targets as low as 0.01% are acceptable.
- Implementations SHOULD still check for collisions where feasible.

---

## 12. Implementation Checklist (Normative)

An implementation MUST:

    1. Use MSB-first bit addressing (bits 0–127).
    2. Set variant bits 64–66 to 111.
    3. Set subvariant bits 67–68 correctly.
    4. Place version bits at 75–78.
    5. Encode a 70-bit signed timestamp with correct negative ordering.
    6. Place issuer ID only at bits 79–88 for issuer UUIDs.
    7. Preserve lexical timestamp sort order.
    8. Reject UUIDs violating immutable bit positions.

---

## 13. Authoritative Field Map (Normative Summary)

- Bits 0–63: Timestamp segment A (sign at bit 0)
- Bits 64–66: Variant (111)
- Bits 67–68: Subvariant
- Bits 69–74: Timestamp continuation / reserved
- Bits 75–78: Version
- Bits 79–88: Issuer ID (issuer variant only)
- Bits 89–127: Payload / entropy / reserved

---

## 14. Project Governance (Informative)

- This document is the authoritative reference.
- Category A and Category B assignments are handled in separate workstreams.
- Immutable fields MUST NOT change without explicit confirmation.

---

## 15. Purpose Statement (Informative)

This specification defines a stable, extensible UUID architecture enabling timestamp-based ordering and issuer attribution while preserving RFC 4122 and RFC 9562 compatibility and providing implementers with unambiguous, bit-exact rules.
