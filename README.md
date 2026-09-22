# Curate - Local-First Multi-Tenant CRM

A modern, responsive, and cross-platform Relationship & Contact Management Progressive Web App (PWA). Built on the **Interpretable Context Methodology (ICM)** (arXiv:2603.16021v2) and architected with a **Local-First (Offline-First) + Supabase Cloud Sync** foundation.

---

## Key Features

1. **Local-First Architecture (0ms Latency, 100% Offline)**:
   - All contact creation, editing, and searches execute immediately against the user's local device disk using IndexedDB (via Dexie.js).
   - Operates seamlessly without an internet connection (on flights, remote locations, or mobile networks).
   - Zero server cold starts and zero network lag.

2. **Multi-Tenant Business Workspaces**:
   - Supports multiple independent business databases within the same application.
   - Run Business A with a 5-person team, and Business B as a solo consultant—in complete data isolation.
   - Built-in **Workspace Switcher** in the top navigation bar.

3. **Zero-Login Cross-Device Pairing (Office <-> Home <-> Mobile)**:
   - No usernames or passwords required.
   - **One-Click Pairing Link**: Generate a shareable URL (`/#sync=workspaceId:passkey`) to pair a home laptop or phone in one click.
   - **Passkey Pairing**: Enter the short workspace code on any new device to immediately pull the business database.
   - **Last-Write-Wins (LWW)**: Automated timestamp-based conflict resolution reconciles edits made across office and home devices.

4. **Client-Side Formula-Safe Excel Export**:
   - Direct in-browser Excel generation via `exceljs` with zero server roundtrip.
   - **Formula Injection Defense (CWE-1236)**: All exported cells are automatically sanitized, neutralizing formula operators (`=`, `+`, `-`, `@`, `\t`, `\r`, `%`) with a single-quote (`'`) prefix.

5. **Cloud Synchronization (Supabase)**:
   - Automatically pushes pending local changes and pulls remote delta updates when connected.
   - Backed by Supabase Postgres with **Row-Level Security (RLS)** ensuring strict tenant isolation.

6. **Instant Vercel Deployment**:
   - Deploys as a 100% static PWA on Vercel's Edge Network for free with infinite scalability.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Local Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app works immediately in local device mode.

---

## Setting Up Supabase Cloud Sync (Optional)

1. Create a free project on [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Copy and run the contents of [supabase/schema.sql](supabase/schema.sql) (creates tables, indices, and RLS policies).
4. In Curate, click the **Database (Supabase)** icon in the top header, paste your Project URL and Anon API Key, and click **Save & Connect**.
   *(Alternatively, define `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your `.env` or Vercel settings).*

---

## Deploying to Vercel

1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. Import the repository into [Vercel](https://vercel.com):
   - **Framework Preset**: Vite
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
3. (Optional) Add Environment Variables in Vercel:
   - `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `your-anon-key`
4. Click **Deploy**. Your app is live with global CDN performance and PWA capabilities.

---

## Running Verification & Security Tests

- **Run Local Sync, UUID & Conflict Resolution Audit**:
  ```bash
  npm run test:sync
  ```
- **Run Engine & Database Tests**:
  ```bash
  npm run test:engine
  ```
- **Run Security Fuzzing Suite**:
  ```bash
  npm run test:security
  ```
- **TypeScript Type Check**:
  ```bash
  npm run lint
  ```
- **Production Compilation**:
  ```bash
  npm run build
  ```

---

## ICM Workspace Architecture

Following the Interpretable Context Methodology (arXiv:2603.16021v2):

- **Layer 0**: [WORKSPACE.md](WORKSPACE.md) - Global workspace identity and operational rules.
- **Layer 1**: [ROUTING.md](ROUTING.md) - Stage index and dependency map.
- **Layer 2**: `[01-05]_stage_name/CONTEXT.md` - Explicit stage contracts.
- **Layer 3**: `_config/` - Persistent reference material:
  - [_config/architecture_spec.md](_config/architecture_spec.md)
  - [_config/security_policy.md](_config/security_policy.md)
  - [_config/data_schema.json](_config/data_schema.json)
- **Layer 4**: `[01-05]_stage_name/output/` - Intermediate deliverables and verification reports.
