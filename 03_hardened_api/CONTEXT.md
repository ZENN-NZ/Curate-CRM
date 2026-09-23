# Stage 03: Bi-directional Supabase Sync & Device Pairing Engine

## Inputs
| Layer | Source Path | Description |
| :--- | :--- | :--- |
| Layer 3 (Reference) | `../_config/security_policy.md` | Multi-tenant RLS, passkey encryption, and LWW rules |
| Layer 4 (Working)   | `../src/lib/db.ts` | Local IndexedDB engine |

## Process
1. Initialize `@supabase/supabase-js` client with multi-source fallback (Vercel integration env vars, local storage, or local-only mode).
2. Implement push-and-pull delta synchronization using `updated_at` timestamps with foreign-key protection (upserting workspace before leads).
3. Implement `workspaceService.ts` to manage multi-business switching, owner email OTP verification, resilient session recovery, and email-based workspace discovery.
4. Construct `supabase/schema.sql` defining multi-tenant tables, indices, and RLS policies, accompanied by in-app health diagnostics and one-click schema copier.

## Outputs
- `src/lib/supabase.ts`: Supabase client configuration, health check diagnostics, and config metadata.
- `src/services/leadService.ts`: Foreign-key safe delta sync and export engine.
- `src/services/workspaceService.ts`: Device pairing, email OTP verification, resilient workspace discovery, and workspace management.
- `supabase/schema.sql`: Complete cloud migration script.
- **Review Gate**: Verify foreign-key safe lead sync, email-based workspace discovery, resilient storage recovery, and accurate LWW reconciliation.
