# Stage 05: Security Verification & Penetration Audit

## Inputs
| Layer | Source Path | Description |
| :--- | :--- | :--- |
| Layer 3 (Reference) | `../_config/security_policy.md` | Security and penetration testing mandates |
| Layer 4 (Working)   | `../src/services/leadService.ts` | Local-first CRUD & Excel export |
| Layer 4 (Working)   | `../src/services/workspaceService.ts` | Multi-tenant workspace pairing |

## Process
1. Execute `05_security_audit/scripts/test_local_sync.ts` (`npm run test:sync`).
2. Verify UUID collision resistance over 10,000 generated keys.
3. Validate Last-Write-Wins (LWW) conflict resolution between simulated Office and Home devices.
4. Verify multi-tenant partition isolation between multiple businesses.
5. Verify Formula Injection (CWE-1236) neutralization in client-side Excel generation.
6. Execute `05_security_audit/scripts/test_business_sync_fix.ts` (`npm run test:reconnect`) to verify resilient local storage recovery, email-based workspace discovery, and foreign-key safe sync execution order.

## Outputs
- `scripts/test_local_sync.ts`: Automated local-first sync & formula audit script.
- `scripts/test_business_sync_fix.ts`: Business reconnect, session recovery & foreign key integrity audit script.
- `output/security_audit_report.md`: Formal verification report.
- **Review Gate**: Confirm 100% test pass rate across UUID uniqueness, conflict resolution, multi-tenancy, spreadsheet security, and business session persistence.
