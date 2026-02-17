-- Migration: 20260124000000_remove_theme_mode_column.sql
-- Description: Removes the theme_mode column from the database
-- Mode (dark/light/system) becomes a client preference (localStorage)
-- 
-- RATIONALE:
-- - theme_mode is now managed client-side via next-themes + localStorage
-- - Each user chooses Light/Dark/System individually
-- - theme_set remains global (Super Admin)

-- 1. Drop the validation constraint first (if it exists)
ALTER TABLE "public"."system_settings"
DROP CONSTRAINT IF EXISTS "valid_theme_mode";

-- 2. Drop the theme_mode column
ALTER TABLE "public"."system_settings"
DROP COLUMN IF EXISTS "theme_mode";

-- 3. Update the table comment
COMMENT ON TABLE "public"."system_settings" IS 
'Global system settings. theme_set is the global color palette defined by the Super Admin. Mode (dark/light/system) is an individual user preference stored client-side (localStorage).';
