-- Sprint 7: OpenClaw Extended Credentials
-- Adds per-tenant OpenClaw service credentials (OpenRouter, Telegram, Brave Search)

ALTER TABLE public.ai_provider_configs
  ADD COLUMN IF NOT EXISTS openrouter_api_key text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS telegram_bot_token text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS brave_search_api_key text DEFAULT NULL;

-- All values will be stored encrypted (AES-256) by the application layer,
-- just like the existing api_url and api_key columns.
