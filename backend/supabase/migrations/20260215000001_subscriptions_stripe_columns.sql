-- Add Stripe-specific columns to subscriptions table for webhook handling
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS current_period_start timestamptz;

-- Add unique constraint on account_id for upsert support (one subscription per account)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'subscriptions_account_id_key'
    ) THEN
        ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_account_id_key UNIQUE (account_id);
    END IF;
END
$$;
