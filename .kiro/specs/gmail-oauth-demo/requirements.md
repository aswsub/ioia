# Requirements: Gmail OAuth Demo Flow

## Overview

ioia includes Google OAuth and Gmail send routes for a credible demo handoff from generated draft to email sending. The flow should look real, keep secrets server-side, and remain safe for local development.

## Requirements

### 1. OAuth starts from the app and returns to Outreach

**User story:** As a student, I want to connect Gmail and return to the draft I was reviewing.

**Acceptance criteria:**
- OAuth start routes are handled under `api/google/oauth/*`.
- Local backend runs with `npm run dev:api` when testing these routes.
- `APP_BASE_URL` and redirect handling return the user to the app, preferably `?view=Outreach`.

### 2. Server-only secrets remain server-only

**User story:** As a developer, I want OAuth credentials protected from browser exposure.

**Acceptance criteria:**
- `GOOGLE_CLIENT_SECRET` and `GOOGLE_TOKEN_ENCRYPTION_KEY` are read only by backend/API code.
- Browser code uses client helpers and never imports secret env values.
- Kiro env checks mention whether variables exist but never echo actual values.

### 3. Send behavior is demo-safe

**User story:** As a demo presenter, I want sending a draft to feel complete without risking accidental mass mail.

**Acceptance criteria:**
- Send operations are explicit user actions from a draft/detail screen.
- API failures surface friendly UI messages.
- Draft status can be updated to `sent` in local dashboard state after a successful or demo-approved send.

### 4. Documentation stays aligned

**User story:** As a teammate, I want setup instructions to match the implementation.

**Acceptance criteria:**
- `docs/google-oauth.md` lists all required env variables.
- Kiro hooks point developers to `npm run dev:api` for backend route testing.
- Specs are updated if scopes, redirect paths, or token storage change.
