-- =========================================================
-- LEDGR Database Schema for Supabase
-- Copy and paste this into: Supabase Dashboard -> SQL Editor -> Run
-- =========================================================

-- 1. Create table for Users / Accounts
CREATE TABLE IF NOT EXISTS public.app_users (
  id TEXT PRIMARY KEY,
  identifier TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  password TEXT NOT NULL,
  email TEXT DEFAULT '',
  mobile TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create table for Workspace Data (Entities, Clients, Invoices, Categories, Engagements)
CREATE TABLE IF NOT EXISTS public.user_data (
  user_id TEXT PRIMARY KEY REFERENCES public.app_users(id) ON DELETE CASCADE,
  entities JSONB DEFAULT '[]'::jsonb,
  clients JSONB DEFAULT '[]'::jsonb,
  engagements JSONB DEFAULT '[]'::jsonb,
  invoices JSONB DEFAULT '[]'::jsonb,
  categories JSONB DEFAULT '[]'::jsonb,
  active_entity_id TEXT DEFAULT 'all',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- 4. Create Access Policies (Allow Anon Key to Read, Insert, Update, Delete)
DROP POLICY IF EXISTS "Allow all operations on app_users" ON public.app_users;
CREATE POLICY "Allow all operations on app_users" ON public.app_users
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on user_data" ON public.user_data;
CREATE POLICY "Allow all operations on user_data" ON public.user_data
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 5. Helpful index for fast identifier lookups (Mobile / Email)
CREATE INDEX IF NOT EXISTS idx_app_users_identifier ON public.app_users(identifier);
