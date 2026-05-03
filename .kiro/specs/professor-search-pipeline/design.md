# Design: Professor Search and Draft Pipeline

## Flow

1. `AgentView` receives the prompt and parses optional tags.
2. Keyword extraction and intent detection run through Claude helpers where needed.
3. Professor requests call OpenAlex helpers; company requests call company lookup helpers.
4. Candidate context is passed into the cold email prompt modules.
5. Drafts are normalized into `OutreachDraft`.
6. `App.tsx` merges drafts into state and persists them with `saveDraft`.
7. Outreach and detail screens render the saved drafts and status controls.

## Important files

- `src/app/components/AgentView.tsx` — prompt input, tag parsing, tool-step UI, workflow orchestration.
- `src/lib/claude.ts` — Claude wrapper used by frontend workflow code.
- `src/lib/openalex.ts` — professor search.
- `src/lib/find_company.ts` and `src/lib/find_company_live.ts` — company matching.
- `cold_email_workflow/prompts/*.ts` — email prompt building blocks.
- `cold_email_workflow/schemas.ts` — shared workflow schemas.
- `src/app/components/OutreachView.tsx` and `OutreachDetailView.tsx` — draft review.

## Data normalization

The UI historically calls contacts "professors," so company contacts are coerced into the same `OutreachDraft` shape. This is acceptable for the demo as long as labels in the UI remain understandable and no schema assumptions break persistence.

## Kiro verification

Use the manual pipeline hook before demo recordings:

```bash
npm run smoke:tone && npm run test:pipeline
```

Use `npm run build` after changing `AgentView`, prompt code, schemas, or discovery helpers.
