# ioia Kiro Workspace

This `.kiro/` directory records the lightweight automation and implementation specs used while building ioia. It is intentionally pragmatic: the app is a hackathon demo, so hooks focus on catching broken builds, missing environment variables, and regression-prone outreach flows rather than enforcing a heavy process.

## What lives here

- `hooks/` — Kiro hook definitions that can be triggered by edits, prompts, or manual actions.
- `specs/` — feature specs with requirements, design notes, and task lists.
- `steering/` — persistent project guidance for future Kiro sessions.

## How Kiro is used in this app

Kiro acts as a development co-pilot around the application rather than a runtime dependency. The app does not import Kiro packages or ship Kiro code to users. Instead, Kiro specs describe the intended behavior of workflows like professor search, draft generation, Gmail OAuth, and dashboard persistence. Hooks run the same local commands a developer would run manually, such as `npm run build`, `npm test`, `npm run dev`, and API smoke tests.

For demo work, prefer updating specs before making significant changes so the acceptance criteria stay visible while coding.