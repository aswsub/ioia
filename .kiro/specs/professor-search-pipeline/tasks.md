# Tasks: Professor Search and Draft Pipeline

## Task 1 — Prompt parsing

- [ ] Verify natural language prompt submission still works.
- [ ] Verify `@school`, `@topic`, and `@n` parsing with quoted and unquoted values.
- [ ] Verify tag highlighting does not corrupt the original user text.

## Task 2 — Search and matching

- [ ] Test a professor query using OpenAlex-backed search.
- [ ] Test a company-oriented query using company lookup.
- [ ] Confirm slow or failed network calls produce a friendly agent response.
- [ ] Keep result count capped for demo speed.

## Task 3 — Draft generation

- [ ] Confirm `ANTHROPIC_API_KEY` is available before live generation.
- [ ] Run `npm run smoke:tone` after prompt or tone changes.
- [ ] Run `npm run test:pipeline` after schema or end-to-end workflow changes.
- [ ] Review generated draft copy for specific work references and no generic cold-email phrasing.

## Task 4 — Outreach handoff

- [ ] Confirm new drafts appear in Outreach without page refresh.
- [ ] Confirm saved drafts reload after app refresh.
- [ ] Confirm send/discard actions update local state and persistence.
