# STRIDE Threat Model Report (Stage 01 Output)

## Executive Summary
This document analyzes the threat landscape for **Curate** operating as a **Local-First, Multi-Tenant Contact Management PWA** synchronized to **Supabase** and deployed on **Vercel**. Primary defensive priorities include Multi-Tenant Cross-Contamination (OWASP A01), Excel Formula Injection (CWE-1236), and Cross-Device Synchronization Conflicts.

---

## 1. STRIDE Analysis Matrix

| Category | Threat Scenario | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Unauthorized device attempts to pair with a business workspace | High | High-entropy Workspace Passkeys and secure One-Click pairing links with URL-hash stripping |
| **Tampering (Formula Injection)** | Malicious contact payloads (`=cmd|...`, `@SUM...`) injected into exported Excel sheets | **CRITICAL** (RCE/DDE on analyst computer) | `sanitizeForExcel()`: Prepend `'` to all cells starting with formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`, `%`) |
| **Tampering (Data Conflicts)** | Concurrent offline edits from Office and Home devices overwriting data | Med / High (Data corruption) | Last-Write-Wins (LWW) timestamp comparisons and soft-delete tombstones (`is_deleted`) |
| **Repudiation** | User disputes creation, modification, or deletion of contacts | Low | UTC ISO timestamps (`created_at`, `updated_at`) attached to every record |
| **Information Disclosure** | Cross-tenant data leakage between Business A and Business B | **CRITICAL** (PII breach) | Multi-tenant Row-Level Security (RLS) policies in Supabase Postgres on `workspace_id` |
| **Denial of Service** | Network loss halts application workflow | Low | **Local-First Architecture**: 100% of read/write/export features work offline in IndexedDB |
| **Elevation of Privilege** | User attempts to access records outside active workspace | High | Strict workspace partitioning in Dexie IndexedDB and Supabase RLS |

---

## 2. Technical Defense Specifications

### 2.1 Formula Sanitization Algorithm (CWE-1236)
Spreadsheet applications interpret cells starting with `=`, `+`, `-`, `@`, `\t`, `\r`, or `%` as formulas.
```typescript
export function sanitizeForExcel(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  const formulaTriggers = ['=', '+', '-', '@', '\t', '\r', '%'];
  if (str.length > 0 && formulaTriggers.includes(str.charAt(0))) {
    return "'" + str; // Neutralizes formula execution in Excel
  }
  return str;
}
```

### 2.2 Distributed UUID Generation
All records generate UUID v4 keys directly on the client to guarantee mathematically zero ID collisions across distributed offline devices.

### 2.3 Row-Level Security (RLS) Policy Specification
```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow workspace scoped operations" ON leads
  FOR ALL
  USING (workspace_id = current_setting('request.headers')::json->>'x-workspace-id');
```
