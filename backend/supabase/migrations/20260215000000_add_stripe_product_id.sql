-- Add stripe_product_id to plans for Stripe Product tracking
-- This enables auto-sync: when admin creates/edits a plan, we create/update the Stripe Product
-- and store the ID here so subsequent updates can reference the same Product.
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS stripe_product_id text;
