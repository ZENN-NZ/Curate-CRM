# Security Policy & Defensive Standards (Layer 3: Reference)

## 1. Threat Mitigation Mandate

### 1.1 Excel / CSV Formula Injection (CWE-1236)
- **Vulnerability**: Any text cell beginning with formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`, `%`) can execute code via DDE (Dynamic Data Exchange) or launch external URIs when opened in spreadsheet software like Microsoft Excel or LibreOffice.
- **Mandatory Control**:
  1. All values streamed into `exceljs` worksheets must be processed through `sanitizeForExcel()`.
  2. If any string starts with `=`, `+`, `-`, `@`, `\t`, or `\r`, an apostrophe `'` must be prepended.
  3. Cell types must be handled as text/string to prevent unintended evaluation.

### 1.2 SQL Injection Defense (OWASP Top 10 - A03 / CWE-89)
- **Vulnerability**: Unsanitized parameters directly concatenated into SQL strings can permit database compromise or unauthorized table modifications.
- **Mandatory Control**:
  1. Every query executed via `@libsql/client` must use parameterized SQL (`?` placeholders) with values passed strictly in the `args` array.
  2. Zero raw string interpolation in SQL statements (`execute({ sql: '...', args: [...] })`).
  3. Table schemas and migration columns must be statically whitelisted.

### 1.3 Denial of Service & Abuse Mitigation (OWASP API4)
- **Vulnerability**: Public endpoints can be saturated with requests leading to CPU exhaustion or disk inflation.
- **Mandatory Control**:
  1. Rate limiting via `express-rate-limit` configured on all `/api/` endpoints (100 requests per 15-minute window per IP).
  2. Payload limits enforced via `express.json({ limit: '100kb' })`.

### 1.4 Input Validation & Sanitization (OWASP A03 / CWE-20)
- **Vulnerability**: Malformed inputs, oversized payloads, or control characters entering database records.
- **Mandatory Control**:
  1. All inbound write payloads (`POST`, `PUT`) must be validated against `LeadSchema` built with Zod.
  2. Date fields must pass ISO / parseable date verification (`!isNaN(Date.parse(date))`).
  3. String fields enforce strict maximum bounds (`max(100)`, `max(255)`).
  4. Email validation enforces RFC-compliant format.

### 1.5 Client-Side XSS Mitigation & Headers
- **Mandatory Control**:
  1. `helmet` middleware applied to set secure HTTP headers.
  2. React DOM text-node rendering (zero usage of `dangerouslySetInnerHTML`).
  3. Error responses must return structured JSON (`{ success: false, error: ... }`) without leaking raw stack traces to the client.
