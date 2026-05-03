# Project Overview

ioia is a research and internship outreach dashboard for students. A student can ask the agent for professors or companies, review generated outreach drafts, send through the demo Gmail path, and track draft/sent state from the dashboard.

## What the app does

- **Overview / Agent View** — natural language agent interface for finding professors or companies and generating personalized outreach drafts.
- **Outreach** — review generated drafts, open draft detail, send, discard, and track draft/sent status.
- **Professors** — searchable professor directory and research context.
- **Profile** — student profile/auth-related settings.
- **Google/Gmail API routes** — local/serverless route handlers for OAuth status, connect/disconnect, callback, and Gmail message sending.

## Tech stack

- **Framework**: React 18 + TypeScript
- **Build tool**: Vite 6
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite`
- **UI components**: Radix UI primitives and shadcn/ui-style components under `src/app/components/ui/`
- **Auth/persistence**: Supabase client helpers under `src/lib/`
- **LLM**: Anthropic SDK through local Claude helpers and `cold_email_workflow/` prompts
- **Discovery**: OpenAlex helpers plus local/live company matching
- **API**: TypeScript route handlers in `api/` with a local dev server in `server/`
- **Testing**: Vitest and focused TypeScript smoke scripts

## Project location

Run from the repository root:

```bash
npm install
npm run dev
```

For Google OAuth or Gmail route testing, run a second process:

```bash
npm run dev:api
```

## Key files

- `src/app/App.tsx` — root component and high-level view/draft/conversation state.
- `src/app/components/AgentView.tsx` — agent prompt UI, tag parsing, discovery, draft orchestration.
- `src/app/components/OutreachView.tsx` — draft list and empty states.
- `src/app/components/OutreachDetailView.tsx` — draft review/send/discard screen.
- `src/app/components/ProfessorsView.tsx` — professor directory UI.
- `src/app/components/mock-data.ts` — mock UI data and shared dashboard shapes.
- `src/lib/db.ts` — persisted drafts/conversations/profile helpers.
- `src/lib/claude.ts` — Claude wrapper used by app workflows.
- `src/lib/openalex.ts` — professor discovery helpers.
- `cold_email_workflow/` — prompts, schemas, and pipeline test scripts.
- `api/google/` — Google OAuth and Gmail send route handlers.
- `docs/google-oauth.md` — backend environment setup.

## Kiro's role

Kiro is used for development planning and local automation only. `.kiro/specs` documents expected behavior, `.kiro/hooks` runs common checks, and `.kiro/steering` preserves project context. The application should not import or depend on `.kiro` files at runtime.
