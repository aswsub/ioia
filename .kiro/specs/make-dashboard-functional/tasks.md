# Tasks: Make Dashboard Functional Locally

## Task 1 — Create the assets directory and copy the logo

- [ ] Create `Create minimalist dashboard/src/assets/` directory
- [ ] Copy `src/imports/ioia.png` to `src/assets/ioia.png`
- [ ] Verify the Vite plugin in `vite.config.ts` resolves `figma:asset/ioia.png` → `src/assets/ioia.png` ✓ (already correct, no change needed)

## Task 2 — Fix React dependency

- [ ] Open `Create minimalist dashboard/package.json`
- [ ] Add `"react": "18.3.1"` and `"react-dom": "18.3.1"` to the `dependencies` object (not peerDependencies — those can stay as-is)
- [ ] Run `npm install` inside `Create minimalist dashboard/` to install all dependencies

## Task 3 — Verify the dev server starts

- [ ] Run `npm run dev` inside `Create minimalist dashboard/`
- [ ] Confirm Vite starts at `http://localhost:5173` with no errors in terminal
- [ ] Open the browser and confirm the sidebar renders with the ioia logo

## Task 4 — Smoke-test all views

- [ ] Overview (AgentView) — hero state with suggestions renders
- [ ] Send a message — agent thinking state and response appear
- [ ] "Review drafts in Outreach" button navigates to OutreachView with 5 draft cards
- [ ] Outreach — draft cards render, edit and send work
- [ ] Professors — table of 6 professors renders
- [ ] Compose — email compose card renders with Dr. Robert Kim draft
- [ ] Profile — clicking user row opens ProfileView; Back button returns to Overview
