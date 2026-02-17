-- Seed default onboarding categories into system_settings.extended_settings
-- These are the categories shown to new users during onboarding (configurable by super admin)
UPDATE public.system_settings
SET extended_settings = jsonb_set(
  COALESCE(extended_settings, '{}'),
  '{default_categories}',
  '[
    {"name": "Personal Life", "color": "#EC4899", "icon": "Heart"},
    {"name": "Year Goals Tasks", "color": "#F97316", "icon": "Target"},
    {"name": "Work", "color": "#3B82F6", "icon": "Briefcase"},
    {"name": "Studies", "color": "#8B5CF6", "icon": "BookOpen"}
  ]'::jsonb
)
WHERE id = true;
