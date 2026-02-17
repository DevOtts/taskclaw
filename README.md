<p align="center">
  <h1 align="center">TaskClaw</h1>
  <p align="center">
    Open-source AI-powered task management with Kanban, integrations, and team collaboration.
  </p>
</p>

<p align="center">
  <a href="./LICENSE.md"><img src="https://img.shields.io/badge/license-Sustainable%20Use-blue" alt="License" /></a>
  <a href="https://hub.docker.com/u/taskclaw"><img src="https://img.shields.io/docker/pulls/taskclaw/backend" alt="Docker Pulls" /></a>
  <a href="https://github.com/taskclaw/taskclaw/actions"><img src="https://img.shields.io/github/actions/workflow/status/taskclaw/taskclaw/ci.yml" alt="CI" /></a>
</p>

---

## What is TaskClaw?

TaskClaw is a self-hostable task management platform that combines a visual Kanban board with AI chat, knowledge management, and bidirectional sync with tools like Notion and ClickUp. Think of it as your AI-powered command center for tasks.

**Key Features:**

- **Kanban Board** — Drag-and-drop task management with status columns
- **AI Chat** — Talk to an AI assistant about your tasks (bring your own API key)
- **Knowledge Base** — Feed context to the AI for smarter assistance
- **Integrations** — Bidirectional sync with Notion, ClickUp, and more (community-extensible)
- **Team Collaboration** — Share projects and tasks with your team
- **Skills & Categories** — Organize tasks by context and teach the AI custom skills
- **Pomodoro Timer** — Built-in focus timer with task association
- **Dark Mode** — Premium, distraction-free interface

## Quick Start

### Docker (Recommended)

**Option 1: Bring your own Supabase**

```bash
git clone https://github.com/taskclaw/taskclaw.git
cd taskclaw

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your Supabase URL and keys

# Start
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000)

**Option 2: All-in-one (includes local Supabase)**

```bash
git clone https://github.com/taskclaw/taskclaw.git
cd taskclaw

# Configure environment
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files (see docs/configuration.md)

# Start with local Supabase
docker compose --profile supabase up -d
```

Open [http://localhost:3000](http://localhost:3000) | Supabase Studio: [http://localhost:7430](http://localhost:7430)

### Local Development

```bash
# Backend
cd backend && cp .env.example .env && npm install && npm run start:dev

# Frontend (in another terminal)
cd frontend && cp .env.example .env && npm install && npm run dev
```

See [docs/development.md](./docs/development.md) for the full development setup guide.

## Upgrading

```bash
TASKCLAW_VERSION=v1.2.0 docker compose pull && docker compose up -d
```

## Documentation

| Document | Description |
|----------|-------------|
| [Self-Hosting Guide](./docs/self-hosting.md) | Complete self-hosting instructions |
| [Configuration](./docs/configuration.md) | All environment variables |
| [Architecture](./docs/architecture.md) | System architecture overview |
| [Development](./docs/development.md) | Local development setup |
| [Adding Integrations](./docs/integrations/adding-an-integration.md) | How to build a new integration |

## Integrations

TaskClaw uses a pluggable adapter system for integrations. Adding a new integration
is one of the best ways to contribute.

| Integration | Status | Description |
|-------------|--------|-------------|
| Notion | Built-in | Bidirectional sync with Notion databases |
| ClickUp | Built-in | Bidirectional sync with ClickUp tasks |
| Jira | Planned | Community contribution welcome |
| Trello | Planned | Community contribution welcome |
| Asana | Planned | Community contribution welcome |
| Linear | Planned | Community contribution welcome |

See [Adding an Integration](./docs/integrations/adding-an-integration.md) to get started.

## Cloud Version

Don't want to self-host? **[TaskClaw Cloud](https://taskclaw.co)** provides a fully
managed version with additional features:

- Managed infrastructure with automatic updates
- Billing and subscription management
- Advanced AI usage analytics
- Priority support

## Tech Stack

- **Frontend**: Next.js 15, React 18, Tailwind CSS, shadcn/ui, Zustand, TanStack Query
- **Backend**: NestJS 11, TypeScript
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: OpenRouter API (bring your own key)
- **Queue**: BullMQ + Redis
- **Drag & Drop**: @dnd-kit

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

The most impactful contributions are **new integrations** — check out the
[integration guide](./docs/integrations/adding-an-integration.md) to add support
for your favorite tool.

## Community

- [GitHub Issues](https://github.com/taskclaw/taskclaw/issues) — Bug reports and feature requests
- [GitHub Discussions](https://github.com/taskclaw/taskclaw/discussions) — Questions and ideas
- [Vision & Roadmap](./VISION.md) — Where TaskClaw is headed

## License

TaskClaw is licensed under the [Sustainable Use License](./LICENSE.md) — free for
personal and internal business use. Enterprise license required for providing
hosted services. Files in `backend/src/ee/` are governed by a separate
[Enterprise License](./LICENSE_EE.md).
