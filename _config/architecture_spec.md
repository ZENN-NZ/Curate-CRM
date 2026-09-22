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
  ├── UI Shell: App.tsx + WorkspaceHeader + LeadCaptureForm + LeadDashboard
  ├── Local Store: Dexie.js (IndexedDB)
  │     ├── Workspaces Table (id, name, passkey, created_at)
  │     └── Leads Table (id, workspace_id, contact fields, updated_at, is_deleted, sync_status)
  ├── Client Export Engine: ExcelJS -> Formula Sanitizer -> .xlsx Blob download
  └── Sync Service: Background reconciliation engine with Supabase
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
   - The target device stores the credentials in `localStorage` and IndexedDB, then initiates an initial delta pull from Supabase.
3. **Multiple Businesses**:
   - The user can belong to multiple workspaces (e.g. Business A and Business B).
   - The `WorkspaceHeader` allows instantaneous switching between isolated client databases.

## 4. Offline Guarantees & Network Resilience
- **Offline First**: All user actions (creates, updates, deletes, Excel exports) complete in <2ms on device disk.
- **Auto Reconnection**: Listens for browser `online` events to automatically flush pending changes to Supabase.
- **Zero Configuration Fallback**: If no Supabase URL/Key is configured, the application functions autonomously in 100% local mode.
