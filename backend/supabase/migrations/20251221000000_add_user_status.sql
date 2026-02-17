-- Add user approval status to public.users
-- We want:
-- - existing users remain ACTIVE
-- - new signups default to PENDING until an admin approves

alter table public.users
  add column if not exists status text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_status_check'
  ) then
    alter table public.users
      add constraint users_status_check
      check (status in ('pending', 'active', 'suspended'));
  end if;
end
$$;

-- Backfill existing users to active so we don't lock out current accounts (e.g. seeded super admin)
update public.users
set status = 'active'
where status is null;

alter table public.users
  alter column status set default 'pending';

alter table public.users
  alter column status set not null;


