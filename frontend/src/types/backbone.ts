// ============================================================================
// Backbone Definition — reusable template for an AI backbone provider
// ============================================================================

export type BackboneProtocol = 'websocket' | 'http' | 'mcp' | 'cli'

export type BackboneHealthStatus = 'healthy' | 'unhealthy' | 'checking' | 'unknown'

export interface BackboneDefinition {
    id: string
    name: string
    slug: string
    description: string | null
    icon: string
    color: string
    protocol: BackboneProtocol
    supports_streaming: boolean
    supports_heartbeat: boolean
    supports_agent_mode: boolean
    supports_tool_use: boolean
    supports_file_access: boolean
    supports_code_execution: boolean
    config_schema: Record<string, any>
    is_active: boolean
}

// ============================================================================
// Backbone Connection — per-account instance linked to a definition
// ============================================================================

export interface BackboneConnection {
    id: string
    account_id: string
    definition_id: string
    definition?: BackboneDefinition
    name: string
    description: string | null
    is_active: boolean
    is_default: boolean
    health_status: BackboneHealthStatus
    last_health_check: string | null
    verified_at: string | null
    total_messages_sent: number
    total_tokens_used: number
    last_used_at: string | null
    created_at: string
    config_preview?: Record<string, string>
}

// ============================================================================
// API Payloads
// ============================================================================

export interface CreateBackboneConnectionPayload {
    definition_id: string
    name: string
    description?: string
    config: Record<string, any>
    is_default?: boolean
}

export interface UpdateBackboneConnectionPayload {
    name?: string
    description?: string
    config?: Record<string, any>
    is_active?: boolean
    is_default?: boolean
}
