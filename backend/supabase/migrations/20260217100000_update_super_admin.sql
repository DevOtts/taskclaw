-- Update super admin from super@admin.com to ferott@gmail.com
-- Password: admin$12345$6 (bcrypt hash below)

-- 1. Delete the duplicate account created by the trigger (keep the manually inserted one)
DELETE FROM public.account_users WHERE account_id = (
  SELECT id FROM public.accounts
  WHERE owner_user_id = 'd0d8c19c-3b36-4423-8c5d-5d5d5d5d5d5d'
  AND id != 'a0a8c19c-3b36-4423-8c5d-5d5d5d5d5d5d'
);
DELETE FROM public.accounts
WHERE owner_user_id = 'd0d8c19c-3b36-4423-8c5d-5d5d5d5d5d5d'
AND id != 'a0a8c19c-3b36-4423-8c5d-5d5d5d5d5d5d';

-- 2. Update auth.users
UPDATE auth.users SET
  email = 'ferott@gmail.com',
  encrypted_password = '$2b$10$2N0zQZZ8GHWC82KKnPacceMznLblh7CoWvT424Vx3iO0XwBiNSa72',
  raw_user_meta_data = '{"full_name": "Fernando Ott"}'::jsonb
WHERE id = 'd0d8c19c-3b36-4423-8c5d-5d5d5d5d5d5d';

-- 3. Update public.users
UPDATE public.users SET
  email = 'ferott@gmail.com',
  name = 'Fernando Ott'
WHERE id = 'd0d8c19c-3b36-4423-8c5d-5d5d5d5d5d5d';

-- 4. Update account name
UPDATE public.accounts SET
  name = 'Fernando Ott''s Team'
WHERE id = 'a0a8c19c-3b36-4423-8c5d-5d5d5d5d5d5d';

-- 5. Insert auth.identities (required for Supabase GoTrue email login)
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'd0d8c19c-3b36-4423-8c5d-5d5d5d5d5d5d',
  'd0d8c19c-3b36-4423-8c5d-5d5d5d5d5d5d',
  'ferott@gmail.com',
  '{"sub": "d0d8c19c-3b36-4423-8c5d-5d5d5d5d5d5d", "email": "ferott@gmail.com", "email_verified": true, "phone_verified": false}'::jsonb,
  'email',
  now(),
  now(),
  now()
) ON CONFLICT (provider_id, provider) DO UPDATE SET
  identity_data = EXCLUDED.identity_data,
  updated_at = now();
