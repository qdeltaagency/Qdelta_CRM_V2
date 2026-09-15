-- ==============================================================================
-- Q DELTA CRM BACKEND DATABASE SCHEMA
-- Production-Ready PostgreSQL Schema for Supabase (Prospect Project Refactor)
-- ==============================================================================

-- 1. CLEAN REBUILD: Drop existing CRM tables
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.payment_milestones CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLES AND CONSTRAINTS
-- ==============================================================================

---------------------------------------------------------------------------------
-- TABLE: leads
---------------------------------------------------------------------------------
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    country TEXT,
    service TEXT,
    requirements TEXT,
    notes TEXT,
    source_type TEXT CHECK (source_type IS NULL OR source_type IN ('website', 'manual')),
    source_platform TEXT CHECK (source_platform IS NULL OR source_platform IN (
        'whatsapp', 
        'instagram', 
        'linkedin', 
        'referral', 
        'email', 
        'other'
    )),
    custom_source TEXT,
    estimated_budget NUMERIC DEFAULT 0,
    agreed_project_value NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    duration_value INTEGER,
    duration_unit TEXT CHECK (duration_unit IS NULL OR duration_unit IN ('days', 'weeks', 'months')),
    timeline TEXT,
    client_type TEXT DEFAULT 'new' CHECK (client_type IN ('new', 'existing')),
    existing_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
        'new',
        'contacted',
        'qualified',
        'proposal_sent',
        'negotiation',
        'won_awaiting_payment',
        'converted',
        'lost'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

---------------------------------------------------------------------------------
-- TABLE: clients
---------------------------------------------------------------------------------
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    country TEXT,
    lead_id UUID UNIQUE REFERENCES public.leads(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

---------------------------------------------------------------------------------
-- TABLE: projects
---------------------------------------------------------------------------------
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    service_type TEXT,
    requirements TEXT,
    timeline TEXT,
    start_date DATE,
    expected_delivery_date DATE,
    agreed_value NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    is_draft BOOLEAN DEFAULT false,
    stage TEXT NOT NULL DEFAULT 'planning' CHECK (stage IN (
        'planning',
        'design',
        'internal_review',
        'development',
        'qa_testing',
        'client_review',
        'revision',
        'ready_for_delivery',
        'handover',
        'completed',
        'on_hold'
    )),
    domain_status TEXT NOT NULL DEFAULT 'pending' CHECK (domain_status IN (
        'pending',
        'received',
        'verified'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

---------------------------------------------------------------------------------
-- TABLE: payment_milestones
---------------------------------------------------------------------------------
CREATE TABLE public.payment_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    milestone_number INT NOT NULL CHECK (milestone_number IN (1, 2, 3)),
    percentage INT NOT NULL CHECK (percentage IN (30, 35)),
    amount NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN (
        'locked',
        'ready',
        'link_generated',
        'pending',
        'paid',
        'failed',
        'overdue'
    )),
    payment_link TEXT,
    provider TEXT CHECK (provider IS NULL OR provider IN ('stripe', 'razorpay', 'paypal')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    unlocked_at TIMESTAMPTZ,
    payment_link_generated_at TIMESTAMPTZ,
    requested_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    CONSTRAINT uq_project_milestone UNIQUE (project_id, milestone_number)
);

---------------------------------------------------------------------------------
-- TABLE: payments
---------------------------------------------------------------------------------
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    milestone_id UUID REFERENCES public.payment_milestones(id) ON DELETE SET NULL,
    provider TEXT CHECK (provider IS NULL OR provider IN ('stripe', 'razorpay', 'paypal')),
    provider_payment_id TEXT,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
    paid_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

---------------------------------------------------------------------------------
-- TABLE: documents
---------------------------------------------------------------------------------
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'proposal',
        'invoice',
        'receipt',
        'agreement',
        'client_agreement',
        'nda',
        'terms',
        'handover'
    )),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft',
        'generated',
        'sent',
        'accepted',
        'completed'
    )),
    file_url TEXT,
    public_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

---------------------------------------------------------------------------------
-- TABLE: activities
---------------------------------------------------------------------------------
CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN (
        'lead_created',
        'lead_updated',
        'converted',
        'project_created',
        'stage_changed',
        'payment_created',
        'payment_paid',
        'document_generated'
    )),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_clients_lead_id ON public.clients(lead_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_lead_id ON public.projects(lead_id);
CREATE INDEX IF NOT EXISTS idx_projects_stage ON public.projects(stage);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.payment_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_milestone_id ON public.payments(milestone_id);
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON public.activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_client_id ON public.activities(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON public.activities(project_id);

-- ==============================================================================
-- 4. AUTOMATION TRIGGERS & FUNCTIONS
-- ==============================================================================

-- Auto-create 3 default payment milestones when project is created
CREATE OR REPLACE FUNCTION public.fn_auto_create_payment_milestones()
RETURNS TRIGGER AS $$
DECLARE
    v_val NUMERIC := COALESCE(NEW.agreed_value, 0);
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.payment_milestones WHERE project_id = NEW.id) THEN
        INSERT INTO public.payment_milestones (project_id, milestone_number, percentage, amount, status, unlocked_at)
        VALUES
            (NEW.id, 1, 30, ROUND(v_val * 0.30, 2), 'ready', now()),
            (NEW.id, 2, 35, ROUND(v_val * 0.35, 2), 'locked', NULL),
            (NEW.id, 3, 35, ROUND(v_val * 0.35, 2), 'locked', NULL);
    END IF;

    IF NEW.client_id IS NOT NULL THEN
        INSERT INTO public.activities (client_id, project_id, lead_id, type, description)
        VALUES (
            NEW.client_id, 
            NEW.id, 
            NEW.lead_id,
            'project_created', 
            'Project "' || NEW.name || '" created with 3 payment milestones (30%, 35%, 35%).'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_project_after_insert ON public.projects;
CREATE TRIGGER trg_project_after_insert
AFTER INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_create_payment_milestones();

-- Project stage changes & unlocking milestone 2 & 3
CREATE OR REPLACE FUNCTION public.fn_handle_project_stage_milestone_unlock()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
        IF NEW.client_id IS NOT NULL THEN
            INSERT INTO public.activities (client_id, project_id, lead_id, type, description)
            VALUES (
                NEW.client_id, 
                NEW.id, 
                NEW.lead_id,
                'stage_changed', 
                'Project stage changed from ' || OLD.stage || ' to ' || NEW.stage
            );
        END IF;

        IF NEW.stage = 'client_review' THEN
            UPDATE public.payment_milestones
            SET status = 'ready', unlocked_at = now()
            WHERE project_id = NEW.id 
              AND milestone_number = 2 
              AND status = 'locked';
        END IF;

        IF NEW.stage IN ('ready_for_delivery', 'handover', 'completed') THEN
            UPDATE public.payment_milestones
            SET status = 'ready', unlocked_at = now()
            WHERE project_id = NEW.id 
              AND milestone_number = 3 
              AND status = 'locked';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_project_stage_change ON public.projects;
CREATE TRIGGER trg_project_stage_change
AFTER UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.fn_handle_project_stage_milestone_unlock();

-- Lead Conversion Stored Procedure
CREATE OR REPLACE FUNCTION public.convert_lead_to_client(
    p_lead_id UUID,
    p_project_name TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_lead RECORD;
    v_client_id UUID;
    v_project_id UUID;
    v_proj_name TEXT;
    v_prospect_proj RECORD;
    v_clean_email TEXT;
BEGIN
    SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead with ID % not found.', p_lead_id;
    END IF;

    IF v_lead.status = 'converted' THEN
        SELECT client_id, id INTO v_client_id, v_project_id FROM public.projects WHERE lead_id = p_lead_id LIMIT 1;
        IF v_client_id IS NULL THEN
            SELECT id INTO v_client_id FROM public.clients WHERE lead_id = p_lead_id OR id = v_lead.existing_client_id;
        END IF;
        RETURN jsonb_build_object(
            'client_id', v_client_id,
            'project_id', v_project_id,
            'lead_id', p_lead_id,
            'status', 'converted'
        );
    END IF;

    v_clean_email := LOWER(TRIM(COALESCE(v_lead.email, '')));
    v_clean_company := LOWER(TRIM(COALESCE(v_lead.company, '')));

    -- Determine Client ID:
    -- 1. If lead was tagged as existing client and has existing_client_id:
    IF v_lead.existing_client_id IS NOT NULL THEN
        SELECT id INTO v_client_id FROM public.clients WHERE id = v_lead.existing_client_id;
    END IF;

    -- 2. If client still not resolved, look up existing client by email (case-insensitive)
    IF v_client_id IS NULL AND v_clean_email <> '' THEN
        SELECT id INTO v_client_id FROM public.clients WHERE LOWER(TRIM(email)) = v_clean_email LIMIT 1;
    END IF;

    -- 3. If client still not resolved, look up existing client by company (case-insensitive)
    IF v_client_id IS NULL AND v_clean_company <> '' THEN
        SELECT id INTO v_client_id FROM public.clients WHERE LOWER(TRIM(company)) = v_clean_company LIMIT 1;
    END IF;

    -- 4. If still not found, look up by lead_id (in case of previously linked)
    IF v_client_id IS NULL THEN
        SELECT id INTO v_client_id FROM public.clients WHERE lead_id = p_lead_id LIMIT 1;
    END IF;

    -- 5. If client doesn't exist, create new client
    IF v_client_id IS NULL THEN
        INSERT INTO public.clients (name, company, email, phone, country, lead_id, status)
        VALUES (
            v_lead.name,
            v_lead.company,
            v_lead.email,
            v_lead.phone,
            v_lead.country,
            v_lead.id,
            'active'
        )
        RETURNING id INTO v_client_id;
    ELSE
        -- Ensure existing client status is active and update contact info if missing
        UPDATE public.clients
        SET status = 'active',
            company = COALESCE(company, v_lead.company),
            phone = COALESCE(phone, v_lead.phone),
            country = COALESCE(country, v_lead.country)
        WHERE id = v_client_id;
    END IF;

    -- Reuse or create project (NO duplication)
    SELECT * INTO v_prospect_proj 
    FROM public.projects 
    WHERE lead_id = p_lead_id 
    ORDER BY created_at DESC 
    LIMIT 1;

    v_proj_name := COALESCE(p_project_name, COALESCE(v_lead.company, v_lead.name) || ' - ' || COALESCE(v_lead.service, 'Project'));

    IF v_prospect_proj.id IS NOT NULL THEN
        UPDATE public.projects
        SET client_id = v_client_id,
            name = COALESCE(p_project_name, name),
            service_type = COALESCE(v_prospect_proj.service_type, v_lead.service),
            requirements = COALESCE(v_prospect_proj.requirements, v_lead.requirements),
            timeline = COALESCE(v_prospect_proj.timeline, v_lead.timeline),
            is_draft = false,
            stage = 'planning',
            agreed_value = COALESCE(v_prospect_proj.agreed_value, v_lead.agreed_project_value, 0),
            currency = COALESCE(v_prospect_proj.currency, v_lead.currency, 'USD')
        WHERE id = v_prospect_proj.id
        RETURNING id INTO v_project_id;
    ELSE
        INSERT INTO public.projects (client_id, lead_id, name, service_type, requirements, timeline, stage, agreed_value, currency, is_draft, domain_status)
        VALUES (
            v_client_id,
            v_lead.id,
            v_proj_name,
            v_lead.service,
            v_lead.requirements,
            v_lead.timeline,
            'planning',
            COALESCE(v_lead.agreed_project_value, 0),
            COALESCE(v_lead.currency, 'USD'),
            false,
            'pending'
        )
        RETURNING id INTO v_project_id;
    END IF;

    -- Re-link documents uploaded for this lead to the client and project
    UPDATE public.documents
    SET client_id = v_client_id,
        project_id = v_project_id
    WHERE lead_id = p_lead_id;

    -- Ensure Milestone 1 is marked as paid upon conversion
    UPDATE public.payment_milestones
    SET status = 'paid',
        paid_at = COALESCE(paid_at, NOW())
    WHERE project_id = v_project_id AND milestone_number = 1;

    -- Update lead status and store existing_client_id link
    UPDATE public.leads
    SET status = 'converted',
        existing_client_id = v_client_id
    WHERE id = p_lead_id;

    -- Log conversion activity
    INSERT INTO public.activities (client_id, project_id, lead_id, type, description)
    VALUES (
        v_client_id,
        v_project_id,
        p_lead_id,
        'converted',
        'Lead "' || v_lead.name || '" converted. Project "' || v_proj_name || '" launched under client.'
    );

    RETURN jsonb_build_object(
        'client_id', v_client_id,
        'project_id', v_project_id,
        'lead_id', p_lead_id,
        'status', 'converted'
    );
END;
$$ LANGUAGE plpgsql;

-- Permissive RLS for internal CRM
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
