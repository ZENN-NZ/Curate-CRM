# Stage 02: Secure SQLite Data Engine & Excel Export

## Inputs
| Layer | Source Path | Description |
| :--- | :--- | :--- |
| Layer 3 (Reference) | `../_config/security_policy.md` | SQL injection defense & Excel formula escaping standards |
| Layer 4 (Working)   | `../01_security_threat_model/output/validation_specs.ts` | Formula escaping functions and Zod validation schemas |

## Process
1. Verify the LibSQL SQLite database initialization and schema migration logic.
2. Enforce strict parameterization on all SQL queries (`?` placeholders with bounded arguments array).
3. Validate that spreadsheet generation applies `sanitizeForExcel` across all exported lead fields.
4. Execute `test_engine.ts` to verify SQLite CRUD execution, concurrency stability, and formula neutralization in generated workbooks.

## Outputs
- `test_engine.ts`: Automated test suite for database and spreadsheet generation.
- `output/engine_verification_report.md`: Verification log and test outcome documentation.
- **Review Gate**: Confirm zero SQL injection vectors and verify that all exported Excel cells neutralize formula injection characters.
