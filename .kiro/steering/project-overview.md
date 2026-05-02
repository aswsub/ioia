# Project Overview

This workspace contains a minimalist research outreach dashboard built with Figma Make and exported as a Vite + React + TypeScript project.

## What the app does

The dashboard helps students (specifically "Rahul Thennarasu") manage cold outreach to research professors. It includes:

- **Overview / Agent View** — an AI agent that generates personalized outreach email drafts based on professor research profiles
- **Outreach** — tracks sent emails with statuses: `sent`, `replied`, `follow_up`, `draft`
- **Professors** — a directory of professors with research interests and match scores
- **Compose** — manual email composition view
- **Profile** — user profile and settings

## Tech stack

- **Framework**: React 18 + TypeScript
- **Build tool**: Vite 6
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite`)
- **UI components**: Radix UI primitives + shadcn/ui-style components in `src/app/components/ui/`
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Motion (Framer Motion v12)

## Project location

All source code lives at the workspace root. Run the app from there:

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

## Key files

- `src/app/App.tsx` — root component, manages active view state
- `src/app/components/Sidebar.tsx` — navigation sidebar
- `src/app/components/mock-data.ts` — all mock data (professors, outreach emails, drafts, analytics)
- `src/app/components/AgentView.tsx` — main AI agent interaction panel
- `src/app/components/OutreachView.tsx` — outreach email list and status tracking
- `src/styles/` — global CSS, fonts, Tailwind config, theme tokens
