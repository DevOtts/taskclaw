-- ============================================================
-- F001: Create backbone_definitions table
-- F002: Create backbone_connections table
-- ============================================================

CREATE TABLE backbone_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'bot',
  color TEXT NOT NULL DEFAULT '#6366f1',
  protocol TEXT NOT NULL CHECK (protocol IN ('websocket', 'http', 'mcp', 'cli')),
  supports_streaming BOOLEAN DEFAULT TRUE,
  supports_heartbeat BOOLEAN DEFAULT FALSE,
  supports_agent_mode BOOLEAN DEFAULT FALSE,
  supports_tool_use BOOLEAN DEFAULT FALSE,
  supports_file_access BOOLEAN DEFAULT FALSE,
  supports_code_execution BOOLEAN DEFAULT FALSE,
  config_schema JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE backbone_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  definition_id UUID NOT NULL REFERENCES backbone_definitions(id),
  name TEXT NOT NULL,
  description TEXT,
  config_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  health_status TEXT DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'unhealthy', 'checking', 'unknown')),
  last_health_check TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  total_messages_sent BIGINT DEFAULT 0,
  total_tokens_used BIGINT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (account_id, is_default) WHERE is_default = TRUE
);

CREATE INDEX idx_backbone_connections_account ON backbone_connections(account_id);
CREATE INDEX idx_backbone_connections_definition ON backbone_connections(definition_id);
