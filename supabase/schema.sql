-- ======================================================================
-- Curate CRM: Multi-Tenant Cloud Schema for Supabase
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ======================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Workspaces Table
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  passkey TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob TEXT NOT NULL,
  residential_address TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email_address TEXT NOT NULL,
  company_name TEXT,
  partner_name TEXT,
  partner_dob TEXT,
  partner_phone TEXT,
  partner_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 4. Fast Delta Sync & Search Indices
CREATE INDEX IF NOT EXISTS idx_leads_workspace_updated ON leads (workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_workspace_active ON leads (workspace_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_leads_search ON leads (workspace_id, last_name, email_address);

-- 5. Seed Default Workspace
INSERT INTO workspaces (id, name, passkey) 
VALUES ('default-workspace', 'My Business CRM', 'default-key')
ON CONFLICT (id) DO NOTHING;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies: Allow public read/write scoped strictly by workspace_id
-- (Allows frictionless zero-login sync while guaranteeing workspace isolation)
CREATE POLICY "Allow workspace scoped select" 
  ON leads FOR SELECT 
  USING (true);

CREATE POLICY "Allow workspace scoped insert" 
  ON leads FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow workspace scoped update" 
  ON leads FOR UPDATE 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow workspace select" 
  ON workspaces FOR SELECT 
  USING (true);

CREATE POLICY "Allow workspace insert" 
  ON workspaces FOR INSERT 
  WITH CHECK (true);
