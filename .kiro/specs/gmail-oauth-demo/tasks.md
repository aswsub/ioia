# Tasks: Gmail OAuth Demo Flow

## Task 1 — Setup

- [ ] Populate server-only env values from `docs/google-oauth.md`.
- [ ] Confirm `GOOGLE_REDIRECT_URI` matches Google Cloud exactly.
- [ ] Start frontend with `npm run dev`.
- [ ] Start API backend with `npm run dev:api`.

## Task 2 — Connection smoke test

- [ ] Start OAuth from the app.
- [ ] Complete Google consent with the demo account.
- [ ] Confirm the callback returns to the app.
- [ ] Confirm status shows connected without exposing token details.

## Task 3 — Send smoke test

- [ ] Generate or open an Outreach draft.
- [ ] Send the draft through the Gmail client path.
- [ ] Confirm API errors are visible and friendly.
- [ ] Confirm successful sends update local draft status to `sent`.

## Task 4 — Regression guardrails

- [ ] Run `npm run build` after OAuth UI or API edits.
- [ ] Do not add broad Gmail scopes without updating this spec and docs.
- [ ] Do not move Google secrets into browser-exposed `VITE_` variables.
