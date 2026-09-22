# Security Policy & Defensive Standards (Layer 3: Reference)

## 1. Multi-Tenant Isolation & Cloud Security

### 1.1 Row-Level Security (RLS) Mandate
- **Vulnerability**: Tenant cross-contamination (e.g. User from Business B querying or editing records of Business A).
- **Mandatory Control**:
  1. Supabase Postgres table `leads` enforces Row-Level Security (`ALTER TABLE leads ENABLE ROW LEVEL SECURITY`).
  2. Every query executed against Supabase must filter strictly by `workspace_id`.
  3. Policies ensure reads and writes match the client's verified workspace context.

### 1.2 Device Pairing & Secret Passkey Protection
- **Vulnerability**: Unauthorized devices guessing workspace IDs to access CRM records.
- **Mandatory Control**:
  1. Workspace pairing requires both `workspace_id` and a high-entropy secret `passkey`.
  2. Pairing URLs passed in the browser hash (`/#sync=...`) are stripped from the browser URL bar immediately after local ingestion to prevent shoulder-surfing or browser history leakage.

### 1.3 Workspace Creation Identity Verification (Email OTP)
- **Vulnerability**: Unverified spam creation of cloud workspaces and unauthorized claiming of business identifiers.
- **Mandatory Control**:
  1. Creating a brand-new workspace mandates owner email verification using a 6-digit One-Time Password (OTP) dispatched via Supabase Auth (`supabase.auth.signInWithOtp` and `verifyOtp`).
  2. The verified workspace record retains `owner_email` and `owner_id` (Supabase Auth UID).
  3. Joining an existing workspace (via pairing link or workspace ID + passkey) requires zero email friction to preserve rapid cross-device pairing.

---

## 2. Threat Mitigation Mandates

### 2.1 Client-Side Excel Formula Injection (CWE-1236)
- **Vulnerability**: Malicious strings starting with formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`, `%`) executing Dynamic Data Exchange (DDE) or external links in desktop spreadsheet software.
- **Mandatory Control**:
  1. `exceljs` workbook generation running in the browser MUST run all cell values through `sanitizeForExcel()`.
  2. Any formula operator prefix is neutralized with a single quote `'`.

### 2.2 Distributed Collision Prevention (UUID v4)
- **Vulnerability**: ID collisions when multiple offline devices create records independently.
- **Mandatory Control**:
  1. All new records use client-generated cryptographically random UUID v4 strings.
  2. Primary keys are universally unique before network transmission.

### 2.3 Conflict Resolution (Last-Write-Wins with Timestamps)
- **Vulnerability**: Concurrent edits overwriting newer information.
- **Mandatory Control**:
  1. Every record tracks `updated_at` (ISO 8601 millisecond precision).
  2. Supabase UPSERT operations and local Dexie reconciliation apply the update only when `incoming.updated_at >= existing.updated_at`.
  3. Soft deletes (`is_deleted = true`) propagate removals across all paired devices without data revival loops.
