# System Architecture Specification (Layer 3: Reference)

## 1. Technical Stack
- **Runtime**: Node.js, Express 4.x, TypeScript (executed via `tsx` in development, bundled via `esbuild` for production)
- **Database Engine**: `@libsql/client` managing local SQLite database (`leads.db`)
- **Excel Engine**: `exceljs` generating OpenXML workbooks with frozen headers and auto-fitted columns
- **Security Middleware**: `helmet`, `express-rate-limit`, `cors`, `zod`
- **Frontend**: React 19, Vite 6, Tailwind CSS v4, Lucide React, Motion, `vite-plugin-pwa`

## 2. Component Architecture
```text
Browser Client (React 19 + PWA)
       │
       ▼ (HTTP / JSON / Stream)
Express REST API (server.ts)
  ├── Middleware: Helmet + CORS + RateLimiter + Zod Validation
  ├── Storage Layer: @libsql/client -> SQLite (leads.db)
  └── Export Engine: ExcelJS -> Formula Sanitization -> .xlsx Binary Stream
```

## 3. Data Flow
1. **Lead Capture & Creation**:
   `React Form -> POST /api/leads -> RateLimiter -> Zod Schema Validation -> Parameterized SQL INSERT -> leads.db`
2. **Lead Update**:
   `React Edit Modal -> PUT /api/leads/:id -> RateLimiter -> Zod Schema Validation -> Parameterized SQL UPDATE -> leads.db`
3. **Directory Retrieval**:
   `React Dashboard -> GET /api/leads -> Parameterized SQL SELECT -> JSON Mapping -> React State`
4. **Excel Export**:
   `Dashboard Button -> GET /api/leads/export -> SQL Query -> Formula Sanitizer (CWE-1236) -> ExcelJS Stream -> .xlsx Download`

## 4. Portability & Runtime Configuration
- Server listens on port `3000` (or `PORT` environment variable) on `0.0.0.0`.
- In development (`NODE_ENV !== 'production'`), Vite is attached in middleware mode (`appType: 'spa'`), allowing zero-configuration hot module replacement on a unified port.
- In production, static assets are served from `dist/` with SPA fallback to `dist/index.html`.
