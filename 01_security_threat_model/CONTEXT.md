# Stage 01: Security Threat Modeling & Defensive Specs

## Inputs
| Layer | Source Path | Description |
| :--- | :--- | :--- |
| Layer 3 (Reference) | `../_config/security_policy.md` | Security standards, formula injection policies, rate limits |
| Layer 3 (Reference) | `../_config/data_schema.json` | Contact properties, required constraints, and data bounds |

## Process
1. Perform STRIDE threat modeling on the Curate application (SQLite storage, Express API, ExcelJS export, and React capture frontend).
2. Formulate concrete mitigation architectures for each threat identified (especially CWE-1236 Formula Injection on Excel export and CWE-89 SQL Injection).
3. Build `validation_specs.ts` containing the fortified Zod schemas, date/phone sanitizers, and Excel formula-escaping logic (`sanitizeForExcel`) for downstream consumption.

## Outputs
- `output/threat_model.md`: Formal STRIDE threat analysis document.
- `output/validation_specs.ts`: Validated Zod schemas and formula-sanitizer functions.
- **Review Gate**: Confirm threat mitigations cover all input vectors, database write paths, and spreadsheet generation routines.
