-- Sprint 1: Core OTT Tables for Multi-Source Task Management
-- This migration creates the foundation for task aggregation from multiple sources

-- =============================================================================
-- 1. Categories Table
-- =============================================================================
-- Categories group tasks by context (e.g., "Personal", "Agency", "Side Projects")
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  color text, -- Hex color for UI (e.g., "#3B82F6")
  icon text,  -- Lucide icon name or emoji
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(account_id, name)
);

-- =============================================================================
-- 2. Sources Table
-- =============================================================================
-- Sources represent external integrations (Notion, ClickUp, Trello, etc.)
create table if not exists public.sources (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  provider text not null check (provider in ('notion', 'clickup', 'trello', 'local')),
  config jsonb not null default '{}', -- Provider-specific config (API keys, DB IDs, encrypted)
  sync_status text not null default 'idle' check (sync_status in ('idle', 'syncing', 'error', 'disabled')),
  last_synced_at timestamptz,
  last_sync_error text,
  sync_interval_minutes integer default 30, -- How often to sync
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================================================
-- 3. Tasks Table (Canonical Task Store)
-- =============================================================================
-- This is the source of truth for all tasks across all sources
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null, -- NULL = local task
  external_id text, -- ID in the external system (e.g., Notion page ID)
  title text not null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done', 'blocked')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  completed boolean default false,
  notes text,
  metadata jsonb default '{}', -- Flexible storage for source-specific fields
  external_url text, -- Link back to source (e.g., Notion page URL)
  due_date timestamptz,
  completed_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(source_id, external_id) -- Prevent duplicate syncs
);

-- =============================================================================
-- 4. Sync Jobs Table (Audit Trail)
-- =============================================================================
-- Tracks every sync operation for debugging and monitoring
create table if not exists public.sync_jobs (
  id uuid primary key default uuid_generate_v4(),
  source_id uuid not null references public.sources(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  status text not null check (status in ('pending', 'running', 'completed', 'failed')),
  tasks_synced integer default 0,
  tasks_created integer default 0,
  tasks_updated integer default 0,
  tasks_deleted integer default 0,
  error_log text,
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- =============================================================================
-- 5. Indexes for Performance
-- =============================================================================
create index if not exists idx_categories_account_id on public.categories(account_id);
create index if not exists idx_sources_account_id on public.sources(account_id);
create index if not exists idx_sources_category_id on public.sources(category_id);
create index if not exists idx_sources_sync_status on public.sources(sync_status) where is_active = true;

create index if not exists idx_tasks_account_id on public.tasks(account_id);
create index if not exists idx_tasks_category_id on public.tasks(category_id);
create index if not exists idx_tasks_source_id on public.tasks(source_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_external_id on public.tasks(source_id, external_id);
create index if not exists idx_tasks_completed on public.tasks(completed);

create index if not exists idx_sync_jobs_source_id on public.sync_jobs(source_id);
create index if not exists idx_sync_jobs_status on public.sync_jobs(status);
create index if not exists idx_sync_jobs_started_at on public.sync_jobs(started_at desc);

-- =============================================================================
-- 6. RLS Policies
-- =============================================================================

-- Categories: Users can only access categories in their accounts
alter table public.categories enable row level security;

create policy "Users can view categories in their accounts" on public.categories
  for select using (
    account_id in (select get_auth_user_account_ids())
  );

create policy "Users can create categories in their accounts" on public.categories
  for insert with check (
    account_id in (select get_auth_user_account_ids())
  );

create policy "Users can update categories in their accounts" on public.categories
  for update using (
    account_id in (select get_auth_user_account_ids())
  );

create policy "Users can delete categories in their accounts" on public.categories
  for delete using (
    account_id in (select get_auth_user_account_ids())
  );

-- Sources: Same pattern as categories
alter table public.sources enable row level security;

create policy "Users can view sources in their accounts" on public.sources
  for select using (
    account_id in (select get_auth_user_account_ids())
  );

create policy "Users can create sources in their accounts" on public.sources
  for insert with check (
    account_id in (select get_auth_user_account_ids())
  );

create policy "Users can update sources in their accounts" on public.sources
  for update using (
    account_id in (select get_auth_user_account_ids())
  );

create policy "Users can delete sources in their accounts" on public.sources
  for delete using (
    account_id in (select get_auth_user_account_ids())
  );

-- Tasks: Same pattern as categories
alter table public.tasks enable row level security;

create policy "Users can view tasks in their accounts" on public.tasks
  for select using (
    account_id in (select get_auth_user_account_ids())
  );

create policy "Users can create tasks in their accounts" on public.tasks
  for insert with check (
    account_id in (select get_auth_user_account_ids())
  );

create policy "Users can update tasks in their accounts" on public.tasks
  for update using (
    account_id in (select get_auth_user_account_ids())
  );

create policy "Users can delete tasks in their accounts" on public.tasks
  for delete using (
    account_id in (select get_auth_user_account_ids())
  );

-- Sync Jobs: Read-only for users, writable by backend service role
alter table public.sync_jobs enable row level security;

create policy "Users can view sync jobs for their sources" on public.sync_jobs
  for select using (
    exists (
      select 1 from public.sources
      where sources.id = sync_jobs.source_id
      and sources.account_id in (select get_auth_user_account_ids())
    )
  );

-- Service role can write sync jobs (backend only)
create policy "Service role can manage sync jobs" on public.sync_jobs
  for all using (true) with check (true);

-- =============================================================================
-- 7. Triggers for updated_at
-- =============================================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_categories_updated_at before update on public.categories
  for each row execute function update_updated_at_column();

create trigger update_sources_updated_at before update on public.sources
  for each row execute function update_updated_at_column();

create trigger update_tasks_updated_at before update on public.tasks
  for each row execute function update_updated_at_column();

-- =============================================================================
-- 8. Grant Permissions
-- =============================================================================
grant all on public.categories to authenticated, service_role;
grant all on public.sources to authenticated, service_role;
grant all on public.tasks to authenticated, service_role;
grant all on public.sync_jobs to authenticated, service_role;
grant select on public.sync_jobs to anon;

-- =============================================================================
-- 9. Comments for Documentation
-- =============================================================================
comment on table public.categories is 'Groups tasks by context (Personal, Agency, etc.)';
comment on table public.sources is 'External integrations (Notion, ClickUp, Trello)';
comment on table public.tasks is 'Canonical task store aggregating all sources';
comment on table public.sync_jobs is 'Audit trail for sync operations';
