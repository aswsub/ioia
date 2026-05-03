# Design: Make ioia Dashboard Functional Locally

## Runtime shape

The current app is a Vite React SPA rooted at `src/main.tsx` and `src/app/App.tsx`. `App.tsx` owns high-level view state and passes callbacks into sidebar and feature views. Persistence helpers live in `src/lib/db.ts`; auth helpers live in `src/lib/auth.tsx`; generation and discovery code live in `src/lib/claude.ts`, `src/lib/openalex.ts`, and `cold_email_workflow/`.

Local development has two processes when API-backed Google routes are needed:

```bash
npm run dev      # frontend
npm run dev:api  # local API backend for /api/google/*
```

For UI-only work, the frontend process is enough.

## Asset resolution

The Figma asset import scheme is still used in exported components:

```ts
import ioiaLogo from "figma:asset/ioia.png";
```

`vite.config.ts` resolves this to `src/assets/ioia.png`. The asset already exists and should remain there. Avoid replacing the import in component code unless the Vite plugin is removed intentionally.

## State and data flow

- `App.tsx` owns `activeView`, generated outreach drafts, draft status, selected draft, and conversation list.
- `AgentView` owns message composition and the tool-step animation for the generated outreach workflow.
- Drafts are normalized to `OutreachDraft` so professor and company outreach can share the same dashboard cards.
- `saveDraft`, `loadOutreachDrafts`, `updateDraftStatus`, and conversation helpers persist local state.

## Kiro usage

Kiro is not part of the shipped browser bundle. It supports development through:

1. Specs that describe expected demo behavior and acceptance criteria.
2. Hooks that run local commands after edits or on manual trigger.
3. Steering documents that keep future agent sessions aligned with the app's visual and code conventions.

## Error strategy

Keep errors demo-legible:

- Show clear UI copy for missing credentials or failed network calls.
- Avoid logging secrets or full OAuth tokens.
- Let generated draft failures degrade to an actionable message in the agent conversation.
- Prefer local mock or cached data if live OpenAlex or company discovery is slow during recording.

## Verification

1. `npm install`
2. `npm run build`
3. `npm run dev`
4. Optional API path: `npm run dev:api`
5. Browser smoke test: Overview → send prompt → Outreach draft → open detail → mark sent → Profile → back
