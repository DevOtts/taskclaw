-- Sprint 3: Skills System
-- Custom AI behaviors - configurable instruction sets

-- =====================================================
-- 1. Skills Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,                            -- Brief description shown in UI
  instructions TEXT NOT NULL DEFAULT '',       -- Full prompt instructions (Markdown)
  is_active BOOLEAN DEFAULT TRUE,              -- Can disable without deleting
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT skills_name_not_empty CHECK (CHAR_LENGTH(TRIM(name)) > 0),
  CONSTRAINT skills_instructions_size CHECK (CHAR_LENGTH(instructions) <= 51200), -- 50KB limit
  CONSTRAINT skills_unique_name_per_account UNIQUE(account_id, name)
);

-- =====================================================
-- 2. Indexes
-- =====================================================
-- Primary access pattern: List skills by account
CREATE INDEX idx_skills_account_id 
  ON public.skills(account_id);

-- Filter active skills
CREATE INDEX idx_skills_active 
  ON public.skills(account_id, is_active) 
  WHERE is_active = TRUE;

-- Sort by name
CREATE INDEX idx_skills_name 
  ON public.skills(account_id, name);

-- =====================================================
-- 3. Row-Level Security (RLS)
-- =====================================================
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view skills in their accounts
CREATE POLICY "Users can view skills in their accounts"
  ON public.skills
  FOR SELECT
  USING (account_id IN (SELECT get_auth_user_account_ids()));

-- Policy: Users can create skills in their accounts
CREATE POLICY "Users can create skills in their accounts"
  ON public.skills
  FOR INSERT
  WITH CHECK (
    account_id IN (SELECT get_auth_user_account_ids())
    AND created_by = auth.uid()
  );

-- Policy: Users can update skills in their accounts
CREATE POLICY "Users can update skills in their accounts"
  ON public.skills
  FOR UPDATE
  USING (account_id IN (SELECT get_auth_user_account_ids()));

-- Policy: Users can delete skills in their accounts
CREATE POLICY "Users can delete skills in their accounts"
  ON public.skills
  FOR DELETE
  USING (account_id IN (SELECT get_auth_user_account_ids()));

-- =====================================================
-- 4. Updated At Trigger
-- =====================================================
CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. Comments
-- =====================================================
COMMENT ON TABLE public.skills IS 
  'Skills system - custom AI behaviors/instruction sets for different task types';

COMMENT ON COLUMN public.skills.instructions IS 
  'Markdown instructions prepended to AI system prompt when skill is selected';

COMMENT ON COLUMN public.skills.is_active IS 
  'Inactive skills are hidden from selection but not deleted';
