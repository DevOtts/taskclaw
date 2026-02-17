-- Sprint 2: Conversations Table
-- Stores chat conversations (general or task-linked)

-- =====================================================
-- 1. Conversations Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  title TEXT,                         -- Auto-generated or user-set
  metadata JSONB DEFAULT NULL,        -- Flexible metadata (skill_ids, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. Indexes
-- =====================================================
-- Primary access pattern: List user's conversations
CREATE INDEX idx_conversations_user_id 
  ON public.conversations(user_id);

-- Filter by account
CREATE INDEX idx_conversations_account_id 
  ON public.conversations(account_id);

-- Find task-linked conversations
CREATE INDEX idx_conversations_task_id 
  ON public.conversations(task_id) 
  WHERE task_id IS NOT NULL;

-- Sort by recency (most common query)
CREATE INDEX idx_conversations_user_updated 
  ON public.conversations(user_id, updated_at DESC);

-- =====================================================
-- 3. Row-Level Security (RLS)
-- =====================================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own conversations
CREATE POLICY "Users can view their own conversations"
  ON public.conversations
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can create conversations in their accounts
CREATE POLICY "Users can create conversations in their accounts"
  ON public.conversations
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    AND account_id IN (SELECT get_auth_user_account_ids())
  );

-- Policy: Users can update their own conversations
CREATE POLICY "Users can update their own conversations"
  ON public.conversations
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Users can delete their own conversations
CREATE POLICY "Users can delete their own conversations"
  ON public.conversations
  FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- 4. Updated At Trigger
-- =====================================================
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. Auto-Update Conversation Timestamp on New Message
-- =====================================================
-- Function to update conversation.updated_at when a message is added
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Trigger will be added after messages table is created

-- =====================================================
-- 6. Comments
-- =====================================================
COMMENT ON TABLE public.conversations IS 
  'Chat conversations - can be general or linked to specific tasks';

COMMENT ON COLUMN public.conversations.task_id IS 
  'Optional: Links conversation to a specific task for contextual chat';

COMMENT ON COLUMN public.conversations.title IS 
  'Conversation title - auto-generated from first message or user-set';
