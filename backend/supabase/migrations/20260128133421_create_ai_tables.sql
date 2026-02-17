-- Create ai_conversations table
create table ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New Conversation',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create ai_messages table
create table ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role text not null, -- 'user', 'assistant', 'system', 'tool'
  content text,
  tool_calls jsonb, -- Store tool calls array
  tool_call_id text, -- For tool result messages
  created_at timestamptz default now()
);

-- Enable RLS
alter table ai_conversations enable row level security;
alter table ai_messages enable row level security;

-- Policies for ai_conversations
create policy "Users can view their own conversations"
  on ai_conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own conversations"
  on ai_conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own conversations"
  on ai_conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own conversations"
  on ai_conversations for delete
  using (auth.uid() = user_id);

-- Policies for ai_messages
-- Messages are accessible if the user owns the conversation
create policy "Users can view messages of their conversations"
  on ai_messages for select
  using (
    exists (
      select 1 from ai_conversations
      where ai_conversations.id = ai_messages.conversation_id
      and ai_conversations.user_id = auth.uid()
    )
  );

create policy "Users can insert messages to their conversations"
  on ai_messages for insert
  with check (
    exists (
      select 1 from ai_conversations
      where ai_conversations.id = ai_messages.conversation_id
      and ai_conversations.user_id = auth.uid()
    )
  );

-- Indexes for performance
create index idx_ai_conversations_user_id on ai_conversations(user_id);
create index idx_ai_messages_conversation_id on ai_messages(conversation_id);
