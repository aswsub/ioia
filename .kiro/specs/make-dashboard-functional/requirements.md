# Requirements: Make ioia Dashboard Functional Locally

## Overview

ioia is a Vite + React + TypeScript research outreach dashboard. The local development goal is to make the app run as a polished demo with the sidebar, agent workflow, professor search, outreach drafts, profile state, Supabase-backed persistence, and optional Gmail OAuth backend all working from the repository root.

## Requirements

### 1. App boots from the repository root

**User story:** As a developer, I want to start the frontend with one command so I can quickly verify UI changes.

**Acceptance criteria:**
- `npm install` completes without module resolution errors.
- `npm run dev` starts Vite and serves the app on the configured dev port.
- `src/main.tsx` mounts `src/app/App.tsx` without runtime crashes.
- The `figma:asset/ioia.png` import resolves to `src/assets/ioia.png` and the logo renders in the sidebar and agent avatar.

### 2. Environment-dependent features fail gracefully

**User story:** As a developer, I want missing local credentials to produce understandable messages instead of a blank screen.

**Acceptance criteria:**
- Supabase auth checks use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only in browser code.
- Claude-backed draft generation reports a useful error if `ANTHROPIC_API_KEY` is missing from the runtime used by the workflow.
- Gmail OAuth API routes use server-only variables documented in `docs/google-oauth.md` and never expose secret values to the browser.
- Kiro's environment hook can guide the developer without printing secrets.

### 3. Core navigation works

**User story:** As a demo presenter, I want every sidebar destination to render correctly.

**Acceptance criteria:**
- Overview renders `AgentView` with prompt suggestions and conversation history.
- Outreach renders saved draft cards and can open `OutreachDetailView`.
- Professors renders the searchable professor directory.
- Profile renders user profile controls and can return to Overview.
- Active view state remains legible when navigating from generated drafts to Outreach.

### 4. Agent workflow creates drafts

**User story:** As a student, I want to ask for professors and receive usable personalized draft emails.

**Acceptance criteria:**
- The agent accepts natural language plus optional `@school`, `@topic`, and `@n` tags.
- The workflow parses the request, searches OpenAlex or local data, drafts emails through the Claude wrapper, and returns draft cards.
- Drafts include professor/contact identity, subject, body, match score, and source context when available.
- Generated drafts are persisted through `src/lib/db.ts` and appear in Outreach.

### 5. Local verification is lightweight

**User story:** As a hackathon team member, I want confidence checks that are quick enough to run before a recording.

**Acceptance criteria:**
- `npm run build` passes before declaring the demo ready.
- Focused tests such as `npm test`, `npm run smoke:tone`, or `npm run test:pipeline` can be run through Kiro hooks when relevant.
- No database migrations, new auth provider, or production deployment work is required to satisfy this spec.
