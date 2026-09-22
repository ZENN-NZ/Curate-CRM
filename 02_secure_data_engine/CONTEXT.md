# Stage 02: Local-First IndexedDB Engine & Client-Side Excel Export

## Inputs
| Layer | Source Path | Description |
| :--- | :--- | :--- |
| Layer 3 (Reference) | `../_config/security_policy.md` | Client-side formula escaping & UUID standards |
| Layer 4 (Working)   | `../01_security_threat_model/output/validation_specs.ts` | Validation schemas and `sanitizeForExcel` |

## Process
1. Scaffold Dexie IndexedDB client (`src/lib/db.ts`) with tables for `workspaces` and `leads`.
2. Implement `leadService.ts` providing local-first CRUD with client UUID generation.
3. Implement browser-native ExcelJS workbook export with formula injection defense.
4. Verify table indexing and offline query performance.

## Outputs
- `src/lib/db.ts`: IndexedDB database instance.
- `src/services/leadService.ts`: Local-first lead service and client Excel generator.
- **Review Gate**: Confirm zero network dependency for local CRUD operations and verify formula trigger neutralization in exported `.xlsx` Blobs.
