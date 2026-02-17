-- Waitlist table for landing page signups
CREATE TABLE public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'landing_page',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for duplicate checks
CREATE INDEX idx_waitlist_email ON public.waitlist (email);

-- RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form, no auth required)
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

-- Only service role can read (backend + admin)
CREATE POLICY "Service role can read waitlist"
  ON public.waitlist FOR SELECT
  USING (auth.role() = 'service_role');
