-- Migration: Category visibility + Source sync filters
-- Adds visibility toggle for categories and configurable pre-filters for sources

-- =============================================================================
-- 1. Add 'visible' column to categories
-- =============================================================================
-- When visible = false, the category is hidden from the board view
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS visible boolean NOT NULL DEFAULT true;

-- =============================================================================
-- 2. Add 'sync_filters' column to sources
-- =============================================================================
-- Stores provider-specific pre-filters applied during sync
-- Example for Notion: [{"property":"Completed","type":"checkbox","condition":"equals","value":false}]
ALTER TABLE public.sources
  ADD COLUMN IF NOT EXISTS sync_filters jsonb NOT NULL DEFAULT '[]';

-- =============================================================================
-- 3. Add 'category_property' column to sources
-- =============================================================================
-- The name of the property in the external system that maps to our categories
-- e.g. "Category" for Notion, or a custom field name for ClickUp
ALTER TABLE public.sources
  ADD COLUMN IF NOT EXISTS category_property text DEFAULT NULL;

-- =============================================================================
-- 4. Grants
-- =============================================================================
GRANT ALL ON public.categories TO authenticated, service_role;
GRANT ALL ON public.sources TO authenticated, service_role;
