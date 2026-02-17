-- Sprint 2: Messages Table
-- Stores individual chat messages within conversations

-- =====================================================
-- 1. Messages Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',        -- Token count, model info, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. Indexes
-- =====================================================
-- Primary access pattern: Get all messages in a conversation
CREATE INDEX idx_messages_conversation_id 
  ON public.messages(conversation_id);

-- Fetch messages in chronological order (most common query)
CREATE INDEX idx_messages_conversation_created 
  ON public.messages(conversation_id, created_at ASC);

-- Performance optimization for pagination
CREATE INDEX idx_messages_created_at 
  ON public.messages(created_at DESC);

-- =====================================================
-- 3. Row-Level Security (RLS)
-- =====================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create messages in their conversations
CREATE POLICY "Users can create messages in their conversations"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update messages in their conversations (for edits)
CREATE POLICY "Users can update messages in their conversations"
  ON public.messages
  FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete messages in their conversations
CREATE POLICY "Users can delete messages in their conversations"
  ON public.messages
  FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. Trigger: Update Conversation Timestamp
-- =====================================================
-- When a new message is added, update the conversation's updated_at
CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- =====================================================
-- 5. Comments
-- =====================================================
COMMENT ON TABLE public.messages IS 
  'Chat messages within conversations - supports user, assistant, and system roles';

COMMENT ON COLUMN public.messages.role IS 
  'Message role: user (human), assistant (AI), or system (context/instructions)';

COMMENT ON COLUMN public.messages.metadata IS 
  'Additional message data: token counts, model used, timestamp, etc.';

COMMENT ON COLUMN public.messages.content IS 
  'The actual message text content';

-- =====================================================
-- 6. Performance Notes
-- =====================================================
-- For large conversations (100+ messages), consider:
-- 1. Pagination: LIMIT/OFFSET on messages query
-- 2. Lazy loading: Load recent N messages, fetch more on scroll
-- 3. Archiving: Move old conversations to cold storage
