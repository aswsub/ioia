# Design: Kiro-Assisted Outreach Workflow

## Intent

Kiro provides a repeatable engineering workflow around ioia's demo path. It stores the reasoning that would otherwise live in chat history: what the feature should do, which files are involved, and which commands verify it.

## Relationship to the app

Kiro artifacts are outside the runtime application:

```text
.kiro/
  hooks/      developer automation
  specs/      requirements, design, task lists
  steering/   persistent guidance
src/          shipped React app
api/          serverless/backend route handlers
server/       local dev API process
```

The app can be developed using Kiro, but Kiro does not become a dependency of `src/` or `api/`.

## Supported development loop

1. Read the relevant spec.
2. Edit the smallest set of source files.
3. Let hooks run build or focused tests.
4. Update tasks when acceptance criteria change.
5. Run the demo path manually before recording.

## Outreach workflow checkpoints

Kiro should help preserve these checkpoints:

- Request parsing supports natural language and `@school`, `@topic`, `@n` tags.
- Discovery uses OpenAlex or company lookup helpers rather than hardcoded inline UI data.
- Draft generation goes through the Claude/prompt workflow and returns structured draft data.
- Outreach state is persisted through `src/lib/db.ts`.
- Gmail integration remains demo-safe and uses documented backend env variables.

## Prompting guidance for Kiro sessions

When asking Kiro to work on ioia, include the user-facing workflow first, then the likely files. Example:

> Update the Outreach detail send flow. Keep the mail/Gmail demo behavior, preserve the minimalist visual system, and run build afterward. Relevant files: `src/app/components/OutreachDetailView.tsx`, `src/lib/gmail-client.ts`, `api/google/messages/send.ts`.

This keeps the agent from overbuilding or replacing the hackathon demo path with production infrastructure.
