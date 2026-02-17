-- Sprint 3: Knowledge Database
-- Persistent context storage per category (Markdown docs)

-- =====================================================
-- 1. Knowledge Docs Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.knowledge_docs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',           -- Markdown content
  is_master BOOLEAN DEFAULT FALSE,            -- Only 1 master per category
  file_attachments JSONB DEFAULT '[]',        -- Array of Supabase Storage URLs
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT knowledge_docs_title_not_empty CHECK (CHAR_LENGTH(TRIM(title)) > 0),
  CONSTRAINT knowledge_docs_content_size CHECK (CHAR_LENGTH(content) <= 102400) -- 100KB limit
);

-- =====================================================
-- 2. Indexes
-- =====================================================
-- Primary access pattern: List docs by account
CREATE INDEX idx_knowledge_docs_account_id 
  ON public.knowledge_docs(account_id);

-- Filter by category
CREATE INDEX idx_knowledge_docs_category_id 
  ON public.knowledge_docs(category_id) 
  WHERE category_id IS NOT NULL;

-- Find master docs quickly
CREATE INDEX idx_knowledge_docs_master 
  ON public.knowledge_docs(account_id, category_id, is_master) 
  WHERE is_master = TRUE;

-- Sort by recency
CREATE INDEX idx_knowledge_docs_updated 
  ON public.knowledge_docs(account_id, updated_at DESC);

-- =====================================================
-- 3. Master Doc Constraint
-- =====================================================
-- Ensure only ONE master doc per category per account
CREATE UNIQUE INDEX idx_knowledge_docs_unique_master 
  ON public.knowledge_docs(account_id, category_id) 
  WHERE is_master = TRUE AND category_id IS NOT NULL;

-- Allow multiple master docs for uncategorized (category_id IS NULL)
-- (User can have one general master doc per account)
CREATE UNIQUE INDEX idx_knowledge_docs_unique_master_uncategorized 
  ON public.knowledge_docs(account_id) 
  WHERE is_master = TRUE AND category_id IS NULL;

-- =====================================================
-- 4. Row-Level Security (RLS)
-- =====================================================
ALTER TABLE public.knowledge_docs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view knowledge docs in their accounts
CREATE POLICY "Users can view knowledge docs in their accounts"
  ON public.knowledge_docs
  FOR SELECT
  USING (account_id IN (SELECT get_auth_user_account_ids()));

-- Policy: Users can create knowledge docs in their accounts
CREATE POLICY "Users can create knowledge docs in their accounts"
  ON public.knowledge_docs
  FOR INSERT
  WITH CHECK (
    account_id IN (SELECT get_auth_user_account_ids())
    AND created_by = auth.uid()
  );

-- Policy: Users can update knowledge docs in their accounts
CREATE POLICY "Users can update knowledge docs in their accounts"
  ON public.knowledge_docs
  FOR UPDATE
  USING (account_id IN (SELECT get_auth_user_account_ids()));

-- Policy: Users can delete knowledge docs in their accounts
CREATE POLICY "Users can delete knowledge docs in their accounts"
  ON public.knowledge_docs
  FOR DELETE
  USING (account_id IN (SELECT get_auth_user_account_ids()));

-- =====================================================
-- 5. Trigger: Auto-unset Other Master Docs
-- =====================================================
-- When a doc is set as master, unset all other master docs in that category
CREATE OR REPLACE FUNCTION ensure_single_master_doc()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_master = TRUE THEN
    -- Unset all other master docs in the same category/account
    IF NEW.category_id IS NOT NULL THEN
      UPDATE public.knowledge_docs
      SET is_master = FALSE
      WHERE account_id = NEW.account_id
        AND category_id = NEW.category_id
        AND id != NEW.id
        AND is_master = TRUE;
    ELSE
      -- Uncategorized: unset other uncategorized master docs
      UPDATE public.knowledge_docs
      SET is_master = FALSE
      WHERE account_id = NEW.account_id
        AND category_id IS NULL
        AND id != NEW.id
        AND is_master = TRUE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_ensure_single_master_doc
  BEFORE INSERT OR UPDATE OF is_master ON public.knowledge_docs
  FOR EACH ROW
  WHEN (NEW.is_master = TRUE)
  EXECUTE FUNCTION ensure_single_master_doc();

-- =====================================================
-- 6. Updated At Trigger
-- =====================================================
CREATE TRIGGER update_knowledge_docs_updated_at
  BEFORE UPDATE ON public.knowledge_docs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. Comments
-- =====================================================
COMMENT ON TABLE public.knowledge_docs IS 
  'Knowledge database - persistent context storage per category for AI';

COMMENT ON COLUMN public.knowledge_docs.content IS 
  'Markdown content - can include facts, contacts, processes, preferences';

COMMENT ON COLUMN public.knowledge_docs.is_master IS 
  'Master doc for category - auto-injected into AI context for category tasks';

COMMENT ON COLUMN public.knowledge_docs.file_attachments IS 
  'JSON array of file metadata: [{name, url, size, type}]';
