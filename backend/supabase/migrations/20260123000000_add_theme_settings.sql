-- Migration: 20260123000000_add_theme_settings.sql
-- Descrição: Adiciona colunas de configuração de tema à tabela system_settings

-- Adicionar colunas de tema à tabela system_settings existente
ALTER TABLE "public"."system_settings" 
ADD COLUMN IF NOT EXISTS "theme_set" TEXT DEFAULT 'corporate',
ADD COLUMN IF NOT EXISTS "theme_mode" TEXT DEFAULT 'light',
ADD COLUMN IF NOT EXISTS "extended_settings" JSONB DEFAULT '{}';

-- Constraint para validar theme_set (valores permitidos)
ALTER TABLE "public"."system_settings"
ADD CONSTRAINT "valid_theme_set" 
CHECK (theme_set IN ('corporate', 'funky', 'blue', 'red', 'ocean-blue', 'ruby-red', 'emerald-green', 'amber-gold'));

-- Constraint para validar theme_mode
ALTER TABLE "public"."system_settings"
ADD CONSTRAINT "valid_theme_mode" 
CHECK (theme_mode IN ('light', 'dark', 'system'));

-- Index para queries rápidas no JSONB (futuras configurações)
CREATE INDEX IF NOT EXISTS "idx_system_settings_extended" 
ON "public"."system_settings" USING GIN ("extended_settings");

-- Comentários de documentação
COMMENT ON COLUMN "public"."system_settings"."theme_set" IS 
'Nome do tema de cores global. Valores: corporate, funky, blue, red, ocean-blue, ruby-red, emerald-green, amber-gold';

COMMENT ON COLUMN "public"."system_settings"."theme_mode" IS 
'Modo de tema padrão. Valores: light, dark, system';

COMMENT ON COLUMN "public"."system_settings"."extended_settings" IS 
'JSONB para configurações futuras flexíveis. Ex: {"custom_logo_url": "...", "footer_text": "..."}';

-- Atualizar row existente com valores default
UPDATE "public"."system_settings" 
SET 
    theme_set = COALESCE(theme_set, 'corporate'),
    theme_mode = COALESCE(theme_mode, 'light'),
    extended_settings = COALESCE(extended_settings, '{}')
WHERE id = true;
