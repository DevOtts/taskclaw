-- Sprint 3: Category-Skills Association
-- Link default skills to categories (auto-load for category tasks)

-- =====================================================
-- 1. Category Skills Junction Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.category_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate skill assignments per category
  CONSTRAINT category_skills_unique UNIQUE(category_id, skill_id)
);

-- =====================================================
-- 2. Indexes
-- =====================================================
-- Find skills for a category
CREATE INDEX idx_category_skills_category 
  ON public.category_skills(category_id);

-- Find categories using a skill
CREATE INDEX idx_category_skills_skill 
  ON public.category_skills(skill_id);

-- =====================================================
-- 3. Row-Level Security (RLS)
-- =====================================================
ALTER TABLE public.category_skills ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view category-skill associations in their accounts
CREATE POLICY "Users can view category skills in their accounts"
  ON public.category_skills
  FOR SELECT
  USING (
    category_id IN (
      SELECT id FROM public.categories 
      WHERE account_id IN (SELECT get_auth_user_account_ids())
    )
  );

-- Policy: Users can create category-skill associations
CREATE POLICY "Users can create category skills in their accounts"
  ON public.category_skills
  FOR INSERT
  WITH CHECK (
    category_id IN (
      SELECT id FROM public.categories 
      WHERE account_id IN (SELECT get_auth_user_account_ids())
    )
    AND skill_id IN (
      SELECT id FROM public.skills 
      WHERE account_id IN (SELECT get_auth_user_account_ids())
    )
  );

-- Policy: Users can delete category-skill associations
CREATE POLICY "Users can delete category skills in their accounts"
  ON public.category_skills
  FOR DELETE
  USING (
    category_id IN (
      SELECT id FROM public.categories 
      WHERE account_id IN (SELECT get_auth_user_account_ids())
    )
  );

-- =====================================================
-- 4. Helper Function: Get Default Skills for Category
-- =====================================================
-- Returns all active skills assigned to a category
CREATE OR REPLACE FUNCTION get_category_default_skills(p_category_id UUID)
RETURNS TABLE (
  skill_id UUID,
  name TEXT,
  instructions TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.instructions
  FROM public.skills s
  INNER JOIN public.category_skills cs ON cs.skill_id = s.id
  WHERE cs.category_id = p_category_id
    AND s.is_active = TRUE
  ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. Comments
-- =====================================================
COMMENT ON TABLE public.category_skills IS 
  'Junction table linking skills to categories - enables default skills per category';

COMMENT ON FUNCTION get_category_default_skills(UUID) IS 
  'Helper function to get all active skills for a category';
