# Coding Standards

## General

- Keep changes focused on the demo path: agent prompt → discovery → draft → Outreach → send/status.
- Prefer small components and helpers. If a component grows beyond ~150 lines because of a new concern, extract a subcomponent or utility.
- Do not add a database, auth provider, or new LLM provider without explicit team agreement.
- Never introduce a dependency when an existing helper or browser API is enough.

## TypeScript

- Type component props with explicit interfaces or type aliases.
- Avoid `any`; use `unknown` plus narrowing or define a real type.
- Keep cross-boundary data validated with existing schemas where available, especially under `cold_email_workflow/` and API helpers.
- Preserve existing shared shapes such as `OutreachDraft` unless all call sites are updated together.

## React and state

- Use local component state for UI-only interactions.
- Keep shared view/draft/conversation state in `App.tsx` unless there is a clear reason to move it.
- Do not read `localStorage` directly during render; use effects or helper functions that are safe in the browser.
- Keep loading and error states visible because they are part of the demo.

## Styling

- Use Tailwind utility classes for layout and spacing.
- Use existing design tokens from `src/styles/theme.css` and font setup from `src/styles/fonts.css`.
- Preserve the minimalist visual style: small typography, light borders, restrained colors.
- Do not add a `tailwind.config.js`; this project uses Tailwind v4 via CSS/Vite.

## Components

- Use existing Radix/shadcn-style primitives before creating new UI primitives.
- The `figma:asset/` import scheme is resolved by the custom Vite plugin. Assets referenced that way must exist under `src/assets/`.
- Avoid large visual rewrites of exported components unless the spec explicitly calls for it.

## LLM and outreach pipeline

- Go through `src/lib/claude.ts` and `cold_email_workflow/prompts/*` for generation-related work.
- Keep prompts specific: cite concrete professor/company work and connect it to student context.
- Run focused smoke scripts after prompt/schema changes when possible.

## Environment and secrets

- Browser-exposed variables must use the `VITE_` prefix.
- Server-only OAuth and API secrets must not be imported into browser code.
- Never print `.env` secret values in logs, Kiro hook output, or chat responses.
