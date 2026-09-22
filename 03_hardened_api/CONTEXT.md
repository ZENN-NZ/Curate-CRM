# Stage 03: Bi-directional Supabase Sync & Device Pairing Engine

## Inputs
| Layer | Source Path | Description |
| :--- | :--- | :--- |
| Layer 3 (Reference) | `../_config/security_policy.md` | Multi-tenant RLS, passkey encryption, and LWW rules |
| Layer 4 (Working)   | `../src/lib/db.ts` | Local IndexedDB engine |

## Process
1. Initialize `@supabase/supabase-js` client with fallback to local-only mode.
2. Implement push-and-pull delta synchronization using `updated_at` timestamps.
3. Implement `workspaceService.ts` to manage multi-business switching, email OTP verification for workspace creation, and zero-login cross-device pairing.
4. Construct `supabase/schema.sql` defining multi-tenant tables, indices, and RLS policies.

## Outputs
- `src/lib/supabase.ts`: Supabase client configuration.
- `src/services/workspaceService.ts`: Device pairing, email OTP verification, and workspace management.
- `supabase/schema.sql`: Complete cloud migration script.
- **Review Gate**: Verify seamless device pairing via URL hash, email OTP verification, and accurate LWW reconciliation on reconnections.
