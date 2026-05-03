# Tasks: Make ioia Dashboard Functional Locally

## Task 1 — Verify install and asset resolution

- [x] Keep `src/assets/ioia.png` present for the `figma:asset/ioia.png` resolver.
- [ ] Run `npm install` from the repository root.
- [ ] Confirm `react` and `react-dom` resolve for the Vite app.
- [ ] Run `npm run build` and confirm there are no unresolved imports.

## Task 2 — Verify frontend boot

- [ ] Run `npm run dev`.
- [ ] Open the local Vite URL.
- [ ] Confirm the sidebar logo and Overview/Agent view render without console errors.
- [ ] Confirm Supabase auth state does not blank the screen when env values are present.

## Task 3 — Smoke-test navigation

- [ ] Overview renders prompt suggestions and chat input.
- [ ] Outreach renders generated or persisted drafts.
- [ ] Opening a draft renders `OutreachDetailView`.
- [ ] Professors renders the professor directory.
- [ ] Profile renders and returns to Overview.

## Task 4 — Smoke-test generation

- [ ] Send a prompt such as `Find ML professors at MIT @topic:LLMs @n:3`.
- [ ] Confirm tag highlighting works in the user bubble.
- [ ] Confirm tool steps appear: parsing, searching, drafting, done.
- [ ] Confirm generated drafts persist and appear in Outreach.
- [ ] Confirm failures produce a readable agent message.

## Task 5 — Optional backend checks

- [ ] Run `npm run dev:api` when testing `/api/google/*` routes.
- [ ] Verify Google OAuth environment values listed in `docs/google-oauth.md` are present locally.
- [ ] Run focused tests for touched code: `npm test`, `npm run smoke:tone`, or `npm run test:pipeline`.
