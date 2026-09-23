# System Architecture Specification (Layer 3: Reference)

## 1. Technical Stack
- **Frontend Framework**: React 19.0.1, Vite 6.2.3, TypeScript, Tailwind CSS v4.1.14, Lucide React, Motion
- **Local Storage Engine**: IndexedDB wrapped via `dexie@4.0.11`
- **Cloud Backend & Sync**: `@supabase/supabase-js@2.49.1` (Postgres database with Row-Level Security)
- **Spreadsheet Generation**: `exceljs@4.4.0` (executing directly in browser memory with Blob downloads)
- **Deployment Platform**: Vercel Edge Network (100% static PWA assets, zero serverless latency or compute cost)

## 2. Distributed Architecture & Component Topology
```text
Browser Client (PWA on Device Disk)
  ├── Build Bridge: vite.config.ts (maps Vercel SUPABASE_URL / SUPABASE_ANON_KEY into client bundle)
  ├── UI Shell: App.tsx + WorkspaceHeader + OnboardingScreen + LeadCaptureForm + LeadDashboard
  │     ├── OnboardingScreen: 3-mode gate (Sign In Reconnect, New Business, Pair Code)
  │     └── WorkspaceHeader: Diagnostics modal (Health check, Vercel source tag, Copy schema.sql)
  ├── Local Store: Dexie.js (IndexedDB) with Resilient Recovery
  │     ├── Workspaces Table (id, name, passkey, owner_email, owner_id, created_at)
  │     ├── Leads Table (id, workspace_id, contact fields, updated_at, is_deleted, sync_status)
  │     └── Storage Recovery: Auto-recovers active workspace from IndexedDB if localStorage was cleared
  ├── Client Export Engine: ExcelJS -> Formula Sanitizer -> .xlsx Blob download
  └── Sync Service: Background reconciliation engine with Supabase
        ├── Step 0 (FK Defense): Ensures active workspace is upserted in Supabase before leads
        ├── Push: Unsynced local records (sync_status === 'pending') via UPSERT
        ├── Pull: Remote delta query (updated_at > last_synced_at)
        └── Conflict Strategy: Last-Write-Wins (LWW) timestamp resolution
```

## 3. Multi-Tenancy & Zero-Login Device Pairing
1. **Workspace Model**:
   - Each business is represented by a `workspace_id` and a `passkey`.
   - Records are partitioned in Postgres by `workspace_id`.
2. **Device Pairing (Office <-> Home <-> Mobile)**:
   - To link a new computer or smartphone without passwords:
   - The user copies the One-Click Pairing Link (`/#sync=workspaceId:passkey`) or enters the Workspace Code.
   - The target device stores the credentials in `localStorage` and IndexedDB, then initiates an immediate delta pull from Supabase.
3. **Multiple Businesses & Email Reconnect**:
   - The user can belong to multiple workspaces (e.g. Business A and Business B).
   - Returning owners can sign in with their email address, verify OTP, and instantly discover and reconnect all owned workspaces across devices.
   - The `WorkspaceHeader` allows instantaneous switching between isolated client databases.

## 4. Offline Guarantees & Network Resilience
- **Offline First**: All user actions (creates, updates, deletes, Excel exports) complete in <2ms on device disk.
- **Auto Reconnection**: Listens for browser `online` events to automatically flush pending changes to Supabase.
- **Zero Configuration Fallback**: If no Supabase URL/Key is configured, the application functions autonomously in 100% local mode with mock OTP (`123456`).
- **In-App Health & Schema Diagnostics**: Live verification of endpoint connectivity and table existence, alerting the user to run `supabase/schema.sql` if tables are missing.

## 5. Startup Lifecycle & Onboarding Gate
1. **First-Time Visitors & Returning Owners**:
   - Gated behind `OnboardingScreen` if no active workspace is detected.
   - **Sign In / Reconnect Flow**: Owner enters email -> verifies OTP -> system discovers all existing workspaces in Supabase -> 1-click restore into the CRM with immediate contact synchronization.
   - **Creation Flow**: Requires Business Name + Owner Email Address. A 6-digit OTP code confirms ownership before creation, binding the workspace to the verified owner in local storage and Supabase.
   - **Join Flow**: Frictionless entry using Workspace ID + Passkey (or One-Click Pairing Link) without email OTP requirements.
2. **Returning Users**:
   - Automatically recognized on launch from local device storage.
   - Resilient fallback checks IndexedDB if `localStorage` was cleared, bypassing onboarding directly to the active CRM dashboard with zero delay.
