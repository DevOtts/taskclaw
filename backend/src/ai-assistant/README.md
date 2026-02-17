# AI Assistant Module

This module enables a conversational AI assistant capable of answering questions about the n8n Hub data by querying the database directly.

## Features

- **Natural Language Querying**: Users can ask questions in plain English.
- **Database Integration**: Connects to Supabase to execute read-only SQL queries.
- **Context-Aware**: Uses a detailed system prompt with the database schema.
- **Isolated**: Built as a standalone NestJS module (`AiAssistantModule`).

## Configuration

Ensure the following environment variables are set in `backend/.env`:

- `OPENROUTER_API_KEY`: Your OpenRouter API key.
- `SUPABASE_URL`: The URL of your Supabase instance.
- `SUPABASE_SERVICE_ROLE_KEY`: The Service Role Key (for bypassing RLS to execute queries).

## Setup

1.  **Migrations**: Run the migration to create the `exec_sql` RPC function.
    ```bash
    # Ensure backend/supabase/migrations/20260128000000_add_exec_sql.sql exists
    # Apply migration (using your supabase CLI or tool)
    supabase db reset # OR specific migration command
    ```

2.  **Dependencies**:
    ```bash
    npm install openai
    ```

## Customization

- **System Prompt**: Edit `src/ai-assistant/system-prompt.ts` to update the schema description or change the AI's persona.
- **Tools**: Add new tools in `src/ai-assistant/tools/` and register them in `AiAssistantService`.

## Security

- The `exec_sql` function is restricted to the `service_role`.
- The `AiAssistantService` explicitly checks that queries start with `SELECT` before execution.
- Only authenticated users can access the chat endpoint.
