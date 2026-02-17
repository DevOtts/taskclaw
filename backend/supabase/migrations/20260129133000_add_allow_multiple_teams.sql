-- Add allow_multiple_teams to system_settings
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS allow_multiple_teams BOOLEAN DEFAULT true;
