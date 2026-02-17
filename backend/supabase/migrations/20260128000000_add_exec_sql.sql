-- Create a function to execute dynamic SQL
-- This allows the AI Assistant (via backend Service Role) to run read-only queries.

create or replace function exec_sql(query_text text)
returns json
language plpgsql
security definer -- Runs with privileges of the creator (usually postgres)
as $$
declare
  result json;
begin
  -- Basic safety check: reject common write keywords if possible, 
  -- though the backend overrides this logic too.
  -- This is a backup.
  if lower(query_text) ~ '\s*(insert|update|delete|drop|alter|truncate|create|grant|revoke)\s+' then
    raise exception 'Only SELECT queries are allowed.';
  end if;

  execute 'select json_agg(t) from (' || query_text || ') t' into result;
  return result;
end;
$$;

-- Security: Prevent public access. Only Service Role should use this.
REVOKE EXECUTE ON FUNCTION exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
