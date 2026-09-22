# STRIDE Threat Model Report (Stage 01 Output)

## Executive Summary
This document analyzes the threat landscape for **Curate** (a relationship and contact management application backed by a local SQLite database and ExcelJS export engine). Primary defensive priorities include Excel Formula Injection (CWE-1236) upon spreadsheet export, SQL Injection (CWE-89) in database persistence, and Uncontrolled Resource Consumption (DoS / CWE-400).

---

## 1. STRIDE Analysis Matrix

| Category | Threat Scenario | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Attacker submits fake or malformed contact and partner profiles | Low / Med | Zod schema validation (`LeadSchema`), RFC email checks, and date parse verification |
| **Tampering (Formula Injection)** | Attacker inputs formula payloads (`=cmd|...`, `@SUM...`, `-2+5`) in contact fields | **CRITICAL** (RCE/DDE on analyst machine opening `.xlsx`) | `sanitizeForExcel()`: prefixing formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`, `%`) with `'` |
| **Tampering (SQL Injection)** | Attacker injects SQL fragments into contact or partner attributes | **CRITICAL** (Database compromise or arbitrary data execution) | 100% Parameterized queries in `@libsql/client` using `args` arrays (`?` placeholders) |
| **Repudiation** | User disputes creation or update of contact records | Low | SQLite `created_at DATETIME DEFAULT CURRENT_TIMESTAMP` audit timestamps |
| **Information Disclosure** | Application error leaks database schema, SQL syntax, or server paths | Med (PII / Schema leak) | Structured JSON error formatting; zero raw error trace disclosure in production |
| **Denial of Service** | High-volume submission or export requests exhaust CPU and SQLite locks | High (Server unavailability) | `express-rate-limit` (100 req/15 min per IP), payload limits (`express.json()`) |
| **Elevation of Privilege** | Attacker attempts to alter immutable columns or system fields | Med | Explicit column whitelisting on `INSERT` and `UPDATE` statements |

---

## 2. Technical Defense Specifications

### 2.1 Formula Sanitization Algorithm (CWE-1236)
Spreadsheet applications (Excel, Calc, Numbers) interpret cells starting with `=`, `+`, `-`, `@`, `\t`, `\r`, or `%` as formulas or commands.

```typescript
export function sanitizeForExcel(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  const formulaTriggers = ['=', '+', '-', '@', '\t', '\r', '%'];
  if (str.length > 0 && formulaTriggers.includes(str.charAt(0))) {
    return "'" + str; // Prefix with apostrophe to force Excel text evaluation
  }
  return str;
}
```

### 2.2 SQL Parameterization Standard (CWE-89)
All database interactions must use positional parameter bindings:
```typescript
await db.execute({
  sql: `INSERT INTO leads (first_name, last_name, dob, residential_address, postal_code, mobile_number, email_address, company_name, partner_name, partner_dob, partner_phone, partner_email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  args: [/* strictly validated values */]
});
```

### 2.3 Strict Zod Validation Schema
All write operations (`POST`, `PUT`) must pass through Zod parser prior to SQL generation, enforcing field bounds, required fields, and format validations.
