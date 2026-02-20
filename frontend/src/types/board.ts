export interface Board {
  id: string
  account_id: string
  template_id: string | null
  name: string
  description: string | null
  icon: string
  color: string
  tags: string[]
  is_favorite: boolean
  display_order: number
  is_archived: boolean
  settings_override: Record<string, any>
  installed_version: string | null
  latest_available_version: string | null
  board_steps?: BoardStep[]
  task_count?: number
  created_at: string
  updated_at: string
}

export interface BoardStep {
  id: string
  board_instance_id: string
  step_key: string
  name: string
  step_type: 'input' | 'ai_process' | 'human_review' | 'action' | 'done'
  position: number
  color: string | null
  ai_enabled?: boolean
  ai_first?: boolean
  task_count?: number
  created_at: string
  updated_at: string
}

export interface BoardTemplate {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string
  color: string
  tags: string[]
  version: string
  is_system: boolean
  is_published: boolean
  author_name: string | null
  install_count: number
  manifest: BoardManifest
  created_at: string
  updated_at: string
}

export interface BoardManifest {
  manifest_version: string
  id: string
  name: string
  description?: string
  version: string
  steps: ManifestStep[]
  settings?: Record<string, any>
}

export interface ManifestStep {
  id: string
  name: string
  type: string
  position: number
  color?: string
  ai_config?: { enabled: boolean; ai_first?: boolean }
  fields?: { inputs: any[]; outputs: any[] }
  on_complete?: string
  on_error?: string | null
}
