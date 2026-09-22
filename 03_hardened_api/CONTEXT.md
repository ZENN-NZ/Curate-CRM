# Stage 03: Hardened Express REST API

## Inputs
| Layer | Source Path | Description |
| :--- | :--- | :--- |
| Layer 3 (Reference) | `../_config/security_policy.md` | Rate limiting, Helmet CSP, and formula sanitization policies |
| Layer 4 (Working)   | `../01_security_threat_model/output/validation_specs.ts` | Zod validation schemas & string sanitizers |
| Layer 4 (Working)   | `../02_secure_data_engine/output/engine_verification_report.md` | LibSQL SQLite client & verified database engine |

## Process
1. Inspect Express server routing and middleware architecture (`helmet`, `cors`, `express-rate-limit`, `express.json`).
2. Verify strict request validation using Zod on `POST /api/leads` and `PUT /api/leads/:id`.
3. Fortify `GET /api/leads/export` with formula injection escaping across all spreadsheet cells.
4. Build and execute `test_api.ts` to test:
   - Valid contact creation via `POST /api/leads`.
   - Rejection of invalid payloads with structured 400 Zod errors.
   - Contact updates via `PUT /api/leads/:id`.
   - Contact listing via `GET /api/leads`.
   - Spreadsheet export streaming via `GET /api/leads/export`.
   - Rate limit protection on excessive API calls.

## Outputs
- `server.ts`: Fortified Express application with sanitized Excel export.
- `test_api.ts`: Automated API test suite.
- `output/api_test_results.md`: Complete API verification report.
- **Review Gate**: Verify that invalid payloads are rejected with 400, rate limits respond with 429 when saturated, and exported spreadsheets are formula-safe.
