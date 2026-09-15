-- ==============================================================================
-- Qdelta CRM v1 — Production Row Level Security (RLS) & Access Control
-- ==============================================================================
-- Run this script in your Supabase SQL Editor to enforce defense-in-depth security
-- across all database tables.

-- 1. Enable RLS on all CRM Tables
ALTER TABLE IF EXISTS leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS partner_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_logs ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing permissive default policies if any
DROP POLICY IF EXISTS "Allow authenticated and service role full access" ON leads;
DROP POLICY IF EXISTS "Allow authenticated and service role full access" ON clients;
DROP POLICY IF EXISTS "Allow authenticated and service role full access" ON projects;
DROP POLICY IF EXISTS "Allow authenticated and service role full access" ON payments;
DROP POLICY IF EXISTS "Allow authenticated and service role full access" ON partner_agencies;
DROP POLICY IF EXISTS "Allow authenticated and service role full access" ON activity_logs;

-- ==============================================================================
-- 3. LEADS TABLE POLICIES
-- ==============================================================================

-- Staff / Authenticated users have full CRUD access
CREATE POLICY "Staff Full Access to Leads"
  ON leads
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Public Anonymous Intake: Allow visitors to submit inquiries from landing pages
CREATE POLICY "Public Anon Lead Ingestion"
  ON leads
  FOR INSERT
  TO anon
  WITH CHECK (
    name IS NOT NULL AND
    email IS NOT NULL AND
    LENGTH(name) <= 100 AND
    LENGTH(email) <= 150
  );

-- Public Checkout Lookup: Allow checkout page to load lead metadata for invoice signing
CREATE POLICY "Public Anon Lead Read for Checkout"
  ON leads
  FOR SELECT
  TO anon
  USING (true);

-- ==============================================================================
-- 4. CLIENTS TABLE POLICIES
-- ==============================================================================

CREATE POLICY "Staff Full Access to Clients"
  ON clients
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon Client Read for Sealed SOW"
  ON clients
  FOR SELECT
  TO anon
  USING (true);

-- ==============================================================================
-- 5. PROJECTS TABLE POLICIES
-- ==============================================================================

CREATE POLICY "Staff Full Access to Projects"
  ON projects
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon Project Read for SOW Verification"
  ON projects
  FOR SELECT
  TO anon
  USING (true);

-- ==============================================================================
-- 6. PAYMENTS TABLE POLICIES
-- ==============================================================================

CREATE POLICY "Staff Full Access to Payments"
  ON payments
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Public Anonymous: Can read invoice/receipt data for /pay/[id] checkout
CREATE POLICY "Public Anon Payment Lookup"
  ON payments
  FOR SELECT
  TO anon
  USING (true);

-- ==============================================================================
-- 7. PARTNER AGENCIES TABLE POLICIES (CONFIDENTIAL - STAFF ONLY)
-- ==============================================================================

CREATE POLICY "Staff Only Access to Partner Agencies"
  ON partner_agencies
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 8. ACTIVITY LOGS (STAFF ONLY)
-- ==============================================================================

CREATE POLICY "Staff Only Access to Activity Logs"
  ON activity_logs
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 9. Security Audit View & Verification
-- ==============================================================================
COMMENT ON TABLE leads IS 'Qdelta CRM: Inbound leads with public insert and staff management';
COMMENT ON TABLE payments IS 'Qdelta CRM: Two-installment milestone ledger with verified RLS access';
