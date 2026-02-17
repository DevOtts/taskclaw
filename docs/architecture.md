# Architecture Overview

This document describes the high-level architecture of TaskClaw, including how the major components interact.

## Monorepo Layout

TaskClaw is a monorepo managed by **Turborepo** with **pnpm** workspaces:

```
taskclaw/
├── backend/    → NestJS 11 API server (port 3001)
├── frontend/   → Next.js 15 web application (port 3000)
├── docker/     → Docker support files (Kong config, DB init)
└── docs/       → Documentation
```

Turborepo orchestrates builds, linting, and dev servers across both packages. The root `pnpm run dev` starts both the backend and frontend in parallel.

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  Next.js App (React, TanStack Query, Zustand, @dnd-kit)    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (REST)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   NestJS Backend                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  Tasks   │ │  Auth    │ │  Sync    │ │ Conversations │  │
│  │  Module  │ │  Module  │ │  Module  │ │    Module     │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Sources  │ │ Adapters │ │Knowledge │ │  AI Provider  │  │
│  │  Module  │ │  Module  │ │  Module  │ │    Module     │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
└──────┬─────────────┬────────────┬───────────────┬───────────┘
       │             │            │               │
       ▼             ▼            ▼               ▼
┌────────────┐ ┌──────────┐ ┌──────────┐  ┌─────────────┐
│  Supabase  │ │  Redis   │ │ External │  │  OpenRouter  │
│ (Postgres  │ │ (BullMQ) │ │   APIs   │  │     API      │
│  + Auth    │ │          │ │ (Notion, │  │              │
│  + Storage)│ │          │ │ ClickUp) │  │              │
└────────────┘ └──────────┘ └──────────┘  └─────────────┘
```

## Backend Modules

The backend follows NestJS module-based architecture. Each module is a self-contained feature area with its own controller, service, DTOs, and module definition.

### Core Modules

| Module | Path | Purpose |
|---|---|---|
| **TasksModule** | `src/tasks/` | CRUD operations for tasks. The central data model of the application |
| **AuthModule** | `src/auth/` | Authentication via Supabase JWT. Provides guards that protect all API routes |
| **AccountsModule** | `src/accounts/` | Multi-tenant account management. Users belong to accounts |
| **UsersModule** | `src/users/` | User profile management |
| **ProjectsModule** | `src/projects/` | Project organization for grouping tasks |
| **TeamsModule** | `src/teams/` | Team management within accounts |
| **CategoriesModule** | `src/categories/` | Task categories and labels |
| **SearchModule** | `src/search/` | Full-text search across tasks and other entities |
| **SystemSettingsModule** | `src/system-settings/` | System-wide configuration and feature flags |
| **SupabaseModule** | `src/supabase/` | Supabase client provider, shared across all modules |
| **CommonModule** | `src/common/` | Shared utilities, middleware (correlation ID, request logging), guards, and pipes |

### Integration Modules

| Module | Path | Purpose |
|---|---|---|
| **AdaptersModule** | `src/adapters/` | Registry of source adapters (Notion, ClickUp, etc.). Auto-discovers adapters via the `@Adapter()` decorator |
| **SourcesModule** | `src/sources/` | CRUD for external source configurations (connects an adapter + credentials to an account) |
| **SyncModule** | `src/sync/` | Background sync engine using BullMQ. Processes inbound (fetch from external) and outbound (push to external) sync jobs |

### AI Modules

| Module | Path | Purpose |
|---|---|---|
| **ConversationsModule** | `src/conversations/` | Chat conversation management. Stores message history and orchestrates AI responses |
| **AiProviderModule** | `src/ai-provider/` | Abstraction layer over AI providers. Currently wraps the OpenRouter API |
| **AiAssistantModule** | `src/ai-assistant/` | AI assistant orchestration layer. Connects conversations with AI providers and tools |
| **KnowledgeModule** | `src/knowledge/` | Knowledge base management. Allows uploading documents that provide context to the AI assistant |
| **SkillsModule** | `src/skills/` | AI skill definitions. Configurable capabilities the AI assistant can use |

### Cloud-Only Modules (`ee/`)

These modules are loaded only when `EDITION=cloud`. Self-hosted users can ignore them.

| Module | Path | Purpose |
|---|---|---|
| **StripeModule** | `src/ee/stripe/` | Stripe payment integration for billing |
| **PlansModule** | `src/ee/plans/` | Subscription plan definitions |
| **SubscriptionsModule** | `src/ee/subscriptions/` | Subscription lifecycle management |
| **LangfuseModule** | `src/ee/langfuse/` | AI observability and tracing via Langfuse |
| **WaitlistModule** | `src/ee/waitlist/` | Waitlist management for cloud launch |

When running in community edition, a `LangfuseNoopModule` is loaded instead, providing a no-op stub so the rest of the codebase can inject the Langfuse service without conditional logic.

## Frontend Architecture

The frontend is built with **Next.js 15** using the **App Router**.

### Key Routes

| Route | Description |
|---|---|
| `/dashboard/tasks` | Main Kanban board with drag-and-drop task management |
| `/dashboard/chat` | AI chat interface for conversations with the assistant |
| `/dashboard/knowledge` | Knowledge base management (upload and manage documents) |
| `/dashboard/projects` | Project list and project-specific views |
| `/dashboard/settings/general` | General account settings |
| `/dashboard/settings/integrations` | Manage external integrations (Notion, ClickUp, etc.) |
| `/dashboard/settings/ai-provider` | Configure AI provider (OpenRouter model selection) |
| `/dashboard/settings/categories` | Manage task categories and labels |
| `/dashboard/settings/skills` | Configure AI skills |
| `/dashboard/settings/team` | Team member management |
| `/dashboard/settings/billing` | Subscription and billing (cloud edition only) |
| `/dashboard/settings/usage` | Usage analytics and quotas |
| `/onboarding` | New user onboarding flow |

### Frontend Technology Stack

- **React 18** with the Next.js App Router (server components + client components)
- **TanStack React Query** for server state management, caching, and optimistic updates
- **Zustand** for client-side state (with persist middleware for cross-session state)
- **@dnd-kit** for drag-and-drop Kanban board interactions
- **Radix UI** primitives for accessible, unstyled UI components
- **Tailwind CSS 4** for styling
- **react-hook-form** + **Zod** for form handling and validation
- **i18next** for internationalization
- **Recharts** for data visualization
- **Lucide React** for icons

### Frontend Directory Structure

```
frontend/src/
├── app/           # Next.js App Router (pages, layouts, route handlers)
├── components/    # Shared React components
├── config/        # Application configuration
├── features/      # Feature-specific components and business logic
├── hooks/         # Custom React hooks
├── kit/           # UI kit / design system primitives
├── lib/           # Utility libraries (API client, Supabase client, etc.)
├── theme/         # Theme configuration and CSS variables
└── types/         # Shared TypeScript type definitions
```

## Data Flow

### Standard CRUD Flow

```
Browser (React)
  → TanStack Query mutation
    → HTTP POST/PUT/DELETE to backend API
      → NestJS Controller
        → Service layer (business logic)
          → Supabase client (database operation)
        ← Response
      ← JSON response
    ← Query cache invalidation
  ← UI update
```

### Sync Flow (External Integrations)

```
Inbound Sync (external → TaskClaw):
  SyncModule (BullMQ job)
    → AdapterRegistry.getAdapter(provider)
      → Adapter.fetchTasks(config, filters)
        → External API (Notion, ClickUp, etc.)
      ← ExternalTask[]
    → Upsert into tasks table (match by external_id)

Outbound Sync (TaskClaw → external):
  Task update in UI
    → Backend TasksService
      → Detect source association
        → SyncModule enqueues outbound job
          → Adapter.pushTaskUpdate(config, update)
            → External API
```

The sync engine uses **BullMQ** with Redis to process jobs asynchronously. Jobs are queued when:
- A scheduled sync fires (inbound)
- A user manually triggers a sync (inbound)
- A task linked to an external source is updated (outbound)

### Authentication Flow

```
Browser
  → Supabase Auth (email/password, OAuth, magic link)
    → Supabase returns JWT (access_token + refresh_token)
  → Frontend stores JWT in cookies via @supabase/ssr
  → Every API request includes Authorization: Bearer <JWT>
    → Backend AuthGuard validates JWT against Supabase
      → Extracts user ID, attaches to request
      → Route handler executes with authenticated context
```

The frontend uses the **BFF (Backend For Frontend) pattern** -- it communicates with Supabase Auth directly for login/signup, but all data operations go through the NestJS backend, which validates the JWT and enforces authorization.

### AI Chat Flow

```
User sends message in /dashboard/chat
  → Frontend POST /conversations/:id/messages
    → ConversationsModule stores user message
      → AiProviderModule builds prompt with:
        - Conversation history
        - Knowledge base context (RAG)
        - Available skills
        - Task context (if relevant)
      → OpenRouter API (or OpenClaw gateway)
        ← AI model response
      → Store assistant message
    ← Stream or return response
  ← Display in chat UI
```

## Edition Gating

The `EDITION` environment variable controls which modules are loaded at startup:

```typescript
// backend/src/app.module.ts
const isCloudEdition = process.env.EDITION === 'cloud';

const editionModules = isCloudEdition
  ? [LangfuseModule, StripeModule, PlansModule, SubscriptionsModule, WaitlistModule]
  : [LangfuseNoopModule];
```

- **Community edition**: Core modules only. No billing, no telemetry. Free and open source.
- **Cloud edition**: Adds Stripe billing, Langfuse AI observability, subscription management, and waitlist functionality.

The `ee/` directory contains all cloud-only code. Community contributors do not need to touch this directory.

## Adapter Pattern

External integrations (Notion, ClickUp, and any future providers) follow a consistent adapter pattern:

1. Each adapter implements the `SourceAdapter` interface (`src/adapters/interfaces/source-adapter.interface.ts`)
2. Adapters are decorated with `@Adapter('providerName')` for auto-discovery
3. The `AdaptersModule` uses NestJS `DiscoveryService` to find and register all adapters at startup
4. The `AdapterRegistry` provides a factory to retrieve adapters by provider name
5. The `SourcesModule` manages the CRUD for source configurations (which adapter + credentials)
6. The `SyncModule` uses the registry to dispatch sync jobs to the correct adapter

To add a new integration, see [Adding an Integration](./integrations/adding-an-integration.md).

## Key Dependencies

| Package | Purpose |
|---|---|
| `@nestjs/*` | NestJS 11 framework (core, config, passport, bullmq, schedule) |
| `@supabase/supabase-js` | Supabase client for Postgres, Auth, and Storage |
| `bullmq` + `ioredis` | Job queue for background sync processing |
| `openai` | OpenAI-compatible client (used for OpenRouter API) |
| `@notionhq/client` | Official Notion API client |
| `passport` + `passport-jwt` | JWT authentication strategy |
| `stripe` | Stripe billing integration (cloud edition) |
| `langfuse` | AI observability (cloud edition) |
| `zod` | Schema validation |
| `next` | Next.js 15 framework |
| `@tanstack/react-query` | Server state management |
| `zustand` | Client state management |
| `@dnd-kit/*` | Drag-and-drop toolkit |
| `@radix-ui/*` | Accessible UI primitives |
| `tailwindcss` | Utility-first CSS framework |
