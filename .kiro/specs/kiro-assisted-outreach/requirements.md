# Requirements: Kiro-Assisted Outreach Workflow

## Overview

This spec describes how Kiro should be used while developing the in-app outreach agent. Kiro is a development assistant only; users interact with ioia's React UI, not with Kiro directly.

## Requirements

### 1. Specs mirror the demo workflow

**User story:** As a developer, I want Kiro specs to describe the same flow users see in the app so implementation work stays aligned with the demo.

**Acceptance criteria:**
- Specs cover request parsing, professor/company discovery, draft generation, Outreach review, and Gmail/send handoff.
- Requirements use app language: Overview, Outreach, Professors, Profile, draft, sent, conversation.
- Acceptance criteria are testable through the local app or npm scripts.

### 2. Hooks automate developer checks

**User story:** As a developer, I want Kiro hooks to run predictable local commands instead of hidden magic.

**Acceptance criteria:**
- Build checks use `npm run build`.
- Pipeline checks use existing scripts such as `npm run smoke:tone` and `npm run test:pipeline`.
- Hooks never mutate production data or commit files.
- Hooks avoid printing secrets from `.env`.

### 3. Kiro context stays repo-aware

**User story:** As a future agent session, I want project-specific guidance available before editing code.

**Acceptance criteria:**
- Steering documents describe the Vite React app, visual system, and coding standards.
- Specs refer to current file paths under `src/`, `api/`, `server/`, and `cold_email_workflow/`.
- Outdated Figma-only assumptions are replaced with the current Supabase, Claude, OpenAlex, and Gmail-aware flow.

### 4. No runtime coupling

**User story:** As a user of ioia, I should not need Kiro installed for the app to work.

**Acceptance criteria:**
- No application code imports from `.kiro/`.
- No bundled UI text references Kiro as a product feature.
- Kiro artifacts remain development documentation and automation only.
