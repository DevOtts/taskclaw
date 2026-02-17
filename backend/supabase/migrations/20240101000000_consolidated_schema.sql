-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Tables
-- -----------------------------------------------------------------------------

-- 1.1 users (profile table, separate from auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  created_at timestamptz default now()
);

-- 1.2 accounts
create table accounts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_user_id uuid references users(id),
  created_at timestamptz default now()
);

-- 1.3 account_users
create table account_users (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text check (role in ('owner', 'admin', 'member')),
  created_at timestamptz default now(),
  unique (account_id, user_id)
);

-- 1.4 projects
create table projects (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- 1.5 project_users
create table project_users (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text check (role in ('admin', 'editor', 'viewer')),
  created_at timestamptz default now(),
  unique (project_id, user_id)
);

-- 1.6 plans
create table plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price_cents integer not null,
  currency text default 'usd',
  interval text check (interval in ('month', 'year')) not null,
  features jsonb,
  is_default boolean default false,
  is_hidden boolean default false,
  created_at timestamptz default now()
);

-- 1.7 subscriptions
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) on delete cascade,
  plan_id uuid references plans(id),
  status text check (status in ('trialing','active','past_due','canceled')),
  provider text default 'stripe',
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz default now()
);

-- 1.8 invitations
create table invitations (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) on delete cascade,
  email text not null,
  role text check (role in ('owner', 'admin', 'member')) not null,
  token text not null unique,
  created_at timestamptz default now(),
  unique(account_id, email)
);

-- 1.9 system_settings
CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" boolean NOT NULL DEFAULT true,
    "allow_multiple_projects" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "system_settings_id_check" CHECK (id) -- Ensures only one row with id=true
);

-- -----------------------------------------------------------------------------
-- 2. Functions & Triggers
-- -----------------------------------------------------------------------------

-- 2.1 handle_new_user (Trigger Function)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_account_id uuid;
begin
  -- 1. Create a record in public.users
  insert into public.users (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');

  -- 2. Create a default account
  insert into public.accounts (name, owner_user_id)
  values (coalesce(new.raw_user_meta_data->>'full_name', 'My Account') || '''s Team', new.id)
  returning id into new_account_id;

  -- 3. Add the user to account_users as owner
  insert into public.account_users (account_id, user_id, role)
  values (new_account_id, new.id, 'owner');

  return new;
end;
$$;

-- 2.2 on_auth_user_created (Trigger)
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2.3 get_auth_user_account_ids (Helper for RLS)
create or replace function get_auth_user_account_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select account_id from account_users where user_id = auth.uid();
$$;

-- 2.4 get_member_projects (Helper for RLS)
create or replace function get_member_projects()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select project_id from project_users where user_id = auth.uid();
$$;

-- 2.5 get_admin_projects (Helper for RLS)
create or replace function get_admin_projects()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select p.id
  from projects p
  join account_users au on p.account_id = au.account_id
  where au.user_id = auth.uid() and au.role in ('owner', 'admin');
$$;

-- 2.6 get_auth_user_project_ids (Helper for RLS)
create or replace function get_auth_user_project_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select project_id from project_users where user_id = auth.uid()
  union
  select p.id
  from projects p
  join account_users au on p.account_id = au.account_id
  where au.user_id = auth.uid() and au.role in ('owner', 'admin');
$$;

-- 2.7 is_account_admin_for_project (Helper for RLS)
create or replace function is_account_admin_for_project(lookup_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 
    from projects p
    join account_users au on p.account_id = au.account_id
    where p.id = lookup_project_id
    and au.user_id = auth.uid()
    and au.role in ('owner', 'admin')
  );
$$;

-- -----------------------------------------------------------------------------
-- 3. RLS Policies
-- -----------------------------------------------------------------------------

-- Enable RLS on all tables
alter table users enable row level security;
alter table accounts enable row level security;
alter table account_users enable row level security;
alter table projects enable row level security;
alter table project_users enable row level security;
alter table plans enable row level security;
alter table subscriptions enable row level security;
alter table invitations enable row level security;

-- 3.1 Users
create policy "Users can view own profile" on users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on users
  for update using (auth.uid() = id);

-- 3.2 Accounts
create policy "Users can view accounts they belong to" on accounts
  for select using (
    id in (select get_auth_user_account_ids())
  );

create policy "Users can create accounts" on accounts
  for insert with check (
    auth.uid() = owner_user_id
  );

create policy "Account members can update account" on accounts
  for update using (
    exists (
      select 1 from account_users
      where account_users.account_id = accounts.id
      and account_users.user_id = auth.uid()
      and account_users.role in ('owner', 'admin')
    )
  );

-- 3.3 Account Users
create policy "Users can view members of their accounts" on account_users
  for select using (
    account_id in (select get_auth_user_account_ids())
  );

create policy "Users can join accounts they own" on account_users
  for insert with check (
    user_id = auth.uid()
    AND
    exists (
      select 1 from accounts
      where id = account_id
      and owner_user_id = auth.uid()
    )
  );

-- 3.4 Projects
create policy "Users can view projects" on projects
  for select using (
    id in (select get_auth_user_project_ids())
  );

create policy "Users can create projects" on projects
  for insert with check (
    account_id in (select get_auth_user_account_ids())
  );

create policy "Users can update projects" on projects
  for update using (
    id in (select get_admin_projects())
    OR
    exists (
      select 1 from project_users
      where project_users.project_id = projects.id
      and project_users.user_id = auth.uid()
      and project_users.role = 'admin'
    )
  );

create policy "Users can delete projects" on projects
  for delete using (
    id in (select get_admin_projects())
    OR
    exists (
      select 1 from project_users
      where project_users.project_id = projects.id
      and project_users.user_id = auth.uid()
      and project_users.role = 'admin'
    )
  );

-- 3.5 Project Users
create policy "Users can view project members" on project_users
  for select using (
    project_id in (select get_auth_user_project_ids())
  );

create policy "Users can add project members" on project_users
  for insert with check (
    project_id in (select get_admin_projects())
  );

create policy "Users can manage project members" on project_users
  for all using (
    is_account_admin_for_project(project_id)
    OR
    exists (
      select 1 from project_users pu
      where pu.project_id = project_users.project_id
      and pu.user_id = auth.uid()
      and pu.role = 'admin'
    )
  );

-- 3.6 Plans
create policy "Plans are publicly readable" on plans
  for select using (true);

-- 3.7 Subscriptions
create policy "Users can view subscriptions of their accounts" on subscriptions
  for select using (
    exists (
      select 1 from account_users
      where account_users.account_id = subscriptions.account_id
      and account_users.user_id = auth.uid()
    )
  );

-- 3.8 Invitations
create policy "Account admins can view invitations" on invitations
  for select using (
    exists (
      select 1 from account_users
      where account_users.account_id = invitations.account_id
      and account_users.user_id = auth.uid()
      and account_users.role in ('owner', 'admin')
    )
  );

create policy "Account admins can create invitations" on invitations
  for insert with check (
    exists (
      select 1 from account_users
      where account_users.account_id = invitations.account_id
      and account_users.user_id = auth.uid()
      and account_users.role in ('owner', 'admin')
    )
  );



-- 3.9 System Settings
alter table system_settings enable row level security;

CREATE POLICY "Allow read access to authenticated users" ON "public"."system_settings"
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow update access to super admins" ON "public"."system_settings"
    FOR UPDATE TO authenticated USING (
        (auth.jwt() ->> 'role') = 'super_admin' OR 
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
    );

-- Grant permissions
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";
GRANT SELECT ON TABLE "public"."system_settings" TO "authenticated";
GRANT SELECT ON TABLE "public"."system_settings" TO "anon";

-- Insert default row
INSERT INTO "public"."system_settings" ("id", "allow_multiple_projects")
VALUES (true, true)
ON CONFLICT ("id") DO NOTHING;
