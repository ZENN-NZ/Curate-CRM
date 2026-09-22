# WORKSPACE.md (Layer 0: Global Identity)

## Workspace Overview
- **Project**: Curate - Local-First, Multi-Tenant Contact & Relationship CRM
- **Methodology**: Interpretable Context Methodology (ICM - arXiv:2603.16021v2)
- **Primary Objective**: Deliver a high-performance, Local-First PWA for contact capture and CRM pipelines. Contacts persist directly on the user's device in IndexedDB (0ms latency, 100% offline), synchronize to Supabase Postgres in the background when connected, isolate multiple businesses via cryptographic `workspace_id` multi-tenancy, gate first-time visitors with an Onboarding Screen (email OTP verification for new workspace owners), and enable zero-login cross-device pairing (Office <-> Home <-> Mobile).
- **Security Baseline**: Multi-tenant Row-Level Security (RLS), owner email OTP verification on workspace creation, client-side formula injection defense (CWE-1236) on Excel exports, cryptographic pairing tokens, and strict Zod schema validation.

## Context Layers Directory
- **Layer 0**: `WORKSPACE.md` (This file - Workspace Identity)
- **Layer 1**: `ROUTING.md` (Stage Routing and Execution Map)
- **Layer 2**: `[01-05]_stage_name/CONTEXT.md` (Stage-Specific Contracts)
- **Layer 3**: `_config/` (Persistent Reference Material - Security, Architecture, Schemas)
- **Layer 4**: `[01-05]_stage_name/output/` (Per-run intermediate deliverables)

## Operational Rules
1. **Local-First Precedence**: Writes always succeed immediately on the user's local device without waiting for network connectivity.
2. **First-Time Onboarding Gate**: New visitors must create or join a workspace before accessing CRM features. Returning users bypass onboarding automatically via local storage.
3. **Owner Identity Verification**: Creating a new workspace requires email OTP verification. Joining an existing workspace relies on pairing secrets without email friction.
4. **Multi-Tenant Isolation**: Records are strictly partitioned by `workspace_id`. Cross-tenant data leakage is prevented via Supabase RLS.
5. **Cross-Device Fluidity**: Users pair office computers, home laptops, and phones using one-click pairing links or workspace codes—without password barriers.
6. **Formula Defense**: All client-side spreadsheet generation must sanitize formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`, `%`) with an apostrophe prefix (`'`).
