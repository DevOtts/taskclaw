-- Enable pgvector extension for vector similarity search
create extension if not exists vector;

-- Add vector embedding columns to existing tables
-- Using vector(1536) to match OpenAI text-embedding-3-small output dimensions

-- 1. Projects: Add embedding for description field
alter table projects 
  add column if not exists description_embedding vector(1536);

-- 2. AI Messages: Add embedding for content field (for semantic conversation search)
alter table ai_messages 
  add column if not exists content_embedding vector(1536);

-- 3. Users: Add embedding for profile information (composite of name and metadata)
alter table users 
  add column if not exists profile_embedding vector(1536);

-- Create HNSW indexes for fast similarity search
-- HNSW (Hierarchical Navigable Small World) provides best performance for large datasets
-- Using cosine distance as it's most common for text embeddings

create index if not exists idx_projects_description_embedding 
  on projects using hnsw (description_embedding vector_cosine_ops);

create index if not exists idx_ai_messages_content_embedding 
  on ai_messages using hnsw (content_embedding vector_cosine_ops);

create index if not exists idx_users_profile_embedding 
  on users using hnsw (profile_embedding vector_cosine_ops);

-- Helper function: Search projects by vector similarity
create or replace function search_projects_vector(
  query_embedding vector(1536),
  match_limit int default 10,
  similarity_threshold float default 0.5
)
returns table (
  id uuid,
  name text,
  description text,
  account_id uuid,
  created_at timestamptz,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select 
    p.id,
    p.name,
    p.description,
    p.account_id,
    p.created_at,
    1 - (p.description_embedding <=> query_embedding) as similarity
  from projects p
  where p.description_embedding is not null
    and 1 - (p.description_embedding <=> query_embedding) > similarity_threshold
  order by p.description_embedding <=> query_embedding
  limit match_limit;
end;
$$;

-- Helper function: Search AI messages by vector similarity within a conversation
create or replace function search_messages_vector(
  query_embedding vector(1536),
  conversation_id_filter uuid default null,
  match_limit int default 10,
  similarity_threshold float default 0.5
)
returns table (
  id uuid,
  conversation_id uuid,
  role text,
  content text,
  created_at timestamptz,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select 
    m.id,
    m.conversation_id,
    m.role,
    m.content,
    m.created_at,
    1 - (m.content_embedding <=> query_embedding) as similarity
  from ai_messages m
  where m.content_embedding is not null
    and (conversation_id_filter is null or m.conversation_id = conversation_id_filter)
    and 1 - (m.content_embedding <=> query_embedding) > similarity_threshold
  order by m.content_embedding <=> query_embedding
  limit match_limit;
end;
$$;

-- Helper function: Search users by profile similarity
create or replace function search_users_vector(
  query_embedding vector(1536),
  match_limit int default 10,
  similarity_threshold float default 0.5
)
returns table (
  id uuid,
  email text,
  name text,
  created_at timestamptz,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select 
    u.id,
    u.email,
    u.name,
    u.created_at,
    1 - (u.profile_embedding <=> query_embedding) as similarity
  from users u
  where u.profile_embedding is not null
    and 1 - (u.profile_embedding <=> query_embedding) > similarity_threshold
  order by u.profile_embedding <=> query_embedding
  limit match_limit;
end;
$$;

-- Helper function: Batch check if tables have any embeddings
create or replace function check_embeddings_status()
returns table (
  table_name text,
  total_rows bigint,
  rows_with_embeddings bigint,
  percentage float
)
language plpgsql
as $$
begin
  return query
  select 
    'projects'::text,
    count(*)::bigint,
    count(description_embedding)::bigint,
    (count(description_embedding)::float / nullif(count(*), 0)::float * 100) as percentage
  from projects
  union all
  select 
    'ai_messages'::text,
    count(*)::bigint,
    count(content_embedding)::bigint,
    (count(content_embedding)::float / nullif(count(*), 0)::float * 100) as percentage
  from ai_messages
  union all
  select 
    'users'::text,
    count(*)::bigint,
    count(profile_embedding)::bigint,
    (count(profile_embedding)::float / nullif(count(*), 0)::float * 100) as percentage
  from users;
end;
$$;

-- Grant necessary permissions for RLS
grant execute on function search_projects_vector(vector, int, float) to authenticated;
grant execute on function search_messages_vector(vector, uuid, int, float) to authenticated;
grant execute on function search_users_vector(vector, int, float) to authenticated;
grant execute on function check_embeddings_status() to authenticated;

-- Comment documentation
comment on column projects.description_embedding is 'Vector embedding of project description for semantic search (1536 dimensions from text-embedding-3-small)';
comment on column ai_messages.content_embedding is 'Vector embedding of message content for semantic conversation search';
comment on column users.profile_embedding is 'Vector embedding of user profile (name + metadata) for semantic user search';

comment on function search_projects_vector is 'Search projects using vector similarity with cosine distance. Returns projects ordered by relevance.';
comment on function search_messages_vector is 'Search AI messages using vector similarity. Optionally filter by conversation_id.';
comment on function search_users_vector is 'Search users using vector similarity on profile information.';
comment on function check_embeddings_status is 'Returns statistics about embedding coverage across tables.';
