-- Sprint 2: AI Provider Configuration (BYOA)
-- This table stores per-account OpenClaw instance credentials

-- =====================================================
-- 1. AI Provider Configs Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_provider_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  provider_type TEXT NOT NULL DEFAULT 'openclaw',
  api_url TEXT NOT NULL,              -- Encrypted in application layer
  api_key TEXT NOT NULL,              -- Encrypted in application layer (AES-256-GCM)
  agent_id TEXT,                      -- OpenClaw-specific agent identifier
  is_active BOOLEAN DEFAULT TRUE,
  verified_at TIMESTAMPTZ,            -- Last successful connection test
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Only one active provider per account per type
  UNIQUE(account_id, provider_type)
);

-- =====================================================
-- 2. Indexes
-- =====================================================
CREATE INDEX idx_ai_provider_configs_account_id 
  ON public.ai_provider_configs(account_id);

CREATE INDEX idx_ai_provider_configs_is_active 
  ON public.ai_provider_configs(is_active) 
  WHERE is_active = TRUE;

-- =====================================================
-- 3. Row-Level Security (RLS)
-- =====================================================
ALTER TABLE public.ai_provider_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view AI provider configs for their accounts
CREATE POLICY "Users can view AI configs in their accounts"
  ON public.ai_provider_configs
  FOR SELECT
  USING (account_id IN (SELECT get_auth_user_account_ids()));

-- Policy: Account owners can create AI provider configs
CREATE POLICY "Account owners can create AI configs"
  ON public.ai_provider_configs
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id 
      FROM public.account_users 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Policy: Account owners can update AI provider configs
CREATE POLICY "Account owners can update AI configs"
  ON public.ai_provider_configs
  FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id 
      FROM public.account_users 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Policy: Account owners can delete AI provider configs
CREATE POLICY "Account owners can delete AI configs"
  ON public.ai_provider_configs
  FOR DELETE
  USING (
    account_id IN (
      SELECT account_id 
      FROM public.account_users 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 4. Updated At Trigger
-- =====================================================
CREATE TRIGGER update_ai_provider_configs_updated_at
  BEFORE UPDATE ON public.ai_provider_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. Comments
-- =====================================================
COMMENT ON TABLE public.ai_provider_configs IS 
  'BYOA (Bring Your Own AI) configuration - stores encrypted OpenClaw credentials per account';

COMMENT ON COLUMN public.ai_provider_configs.api_url IS 
  'OpenClaw instance URL (encrypted at application layer)';

COMMENT ON COLUMN public.ai_provider_configs.api_key IS 
  'OpenClaw API key (encrypted at application layer with AES-256-GCM)';

COMMENT ON COLUMN public.ai_provider_configs.verified_at IS 
  'Timestamp of last successful connection verification';
