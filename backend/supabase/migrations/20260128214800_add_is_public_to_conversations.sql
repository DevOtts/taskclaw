-- Add is_public column to ai_conversations for sharing feature
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Update RLS policy to allow public access for public conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON ai_conversations;
CREATE POLICY "Users can view conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

-- Also update ai_messages policy to allow access to messages of public conversations
DROP POLICY IF EXISTS "Users can view messages of their conversations" ON ai_messages;
CREATE POLICY "Users can view messages of conversations"
  ON ai_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
      AND (ai_conversations.user_id = auth.uid() OR ai_conversations.is_public = true)
    )
  );
