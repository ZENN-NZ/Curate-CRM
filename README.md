# Curate - Relationship & Contact Management Web App

A modern, responsive, and cross-platform Relationship & Contact Management Web App backed by a local SQLite database (`leads.db`) and Excel export engine (`exceljs`). Structured and maintained using the **Interpretable Context Methodology (ICM)** (arXiv:2603.16021v2) and fortified with **enterprise security standards** (Formula injection defense, parameterized SQL, IP rate-limiting, and PWA capabilities).

---

## Key Features

1. **App-Like Cross-Platform Experience**:
   - Modern, clean UI built with React 19, Tailwind CSS v4, Motion, and Lucide icons.
   - Fully responsive for mobile devices, tablets, and desktop workstations.
   - Dual interface:
     - **Contact Directory Dashboard**: Real-time multi-field search, responsive table/card views, inline contact editing modal, and live Excel export.
     - **Add Contact Form**: Comprehensive multi-section form capturing identity, contact coordinates, residential address, company, and optional partner details.
   - **Progressive Web App (PWA)**: In-browser install button and web app manifest for standalone mobile/desktop installation.

2. **Local-First SQLite Engine (`leads.db`)**:
   - High-performance local SQL database managed via `@libsql/client`.
   - Automatic, idempotent table creation and column migrations.
   - 100% Parameterized queries protecting against SQL injection (CWE-89).

3. **Formatted & Formula-Sanitized Excel Export**:
   - Styled OpenXML headers with custom branding colors and auto-fitted columns.
   - **Formula Injection Defense (CWE-1236)**: Any contact attribute starting with formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`, `%`) is automatically neutralized with an apostrophe prefix (`'`) before writing to the workbook.

4. **Rigorous Enterprise Security**:
   - **Strict Input Validation**: All inbound write payloads pass through Zod schemas enforcing bounds, RFC email checks, and date parse verification.
   - **DoS Rate Limiting**: `express-rate-limit` protects API endpoints against request flooding.
   - **HTTP Armor**: Helmet security headers and CORS protection.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Application
```bash
npm run dev
```

This boots the unified application on:
- **Web App**: [http://localhost:3000](http://localhost:3000)

---

## Running Security & Integrity Tests

- **Run Full Security Penetration & Fuzzing Suite**:
  ```bash
  npm run test:security
  ```
- **Test SQLite Data Engine & Excel Formula Sanitization**:
  ```bash
  npm run test:engine
  ```
- **Test Express API Validation & Route Security**:
  ```bash
  npm run test:api
  ```

---

## ICM Workspace Architecture

Following the Interpretable Context Methodology (arXiv:2603.16021v2), Curate is organized into transparent, inspectable context layers:

- **Layer 0**: [WORKSPACE.md](WORKSPACE.md) - Global workspace identity and operational rules.
- **Layer 1**: [ROUTING.md](ROUTING.md) - Task catalog and stage dependency map.
- **Layer 2**: `[01-05]_stage_name/CONTEXT.md` - Explicit stage contracts (Inputs, Process, Outputs).
- **Layer 3**: `_config/` - Persistent reference material ("The Factory"):
  - [_config/architecture_spec.md](_config/architecture_spec.md)
  - [_config/security_policy.md](_config/security_policy.md)
  - [_config/data_schema.json](_config/data_schema.json)
- **Layer 4**: `[01-05]_stage_name/output/` - Intermediate deliverables and verification reports:
  - `01_security_threat_model/output/threat_model.md` & `validation_specs.ts`
  - `02_secure_data_engine/output/engine_verification_report.md`
  - `03_hardened_api/output/api_test_results.md`
  - `04_app_frontend/output/frontend_build_report.md`
  - `05_security_audit/output/security_audit_report.md`
