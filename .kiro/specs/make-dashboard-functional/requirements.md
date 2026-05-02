# Requirements: Make Dashboard Functional Locally

## Overview

The "Create minimalist dashboard" project was exported from Figma Make as a Vite + React + TypeScript app. The goal is to make it run correctly in a local development environment without changing any existing UI or logic — only fixing structural issues that prevent it from running.

## Requirements

### 1. Asset resolution

**User story:** As a developer, I want the `figma:asset/` import scheme to resolve correctly so the ioia logo renders in the sidebar.

**Acceptance criteria:**
- `import ioiaLogo from "figma:asset/ioia.png"` in `Sidebar.tsx` resolves without a build error.
- The logo file `ioia.png` exists at `src/assets/ioia.png` (the path the custom Vite plugin resolves to).
- The app renders the logo in the sidebar header without a broken image.

### 2. Dependencies installed

**User story:** As a developer, I want all npm dependencies installed so the dev server starts without module-not-found errors.

**Acceptance criteria:**
- Running `npm install` inside `Create minimalist dashboard/` completes without errors.
- `react` and `react-dom` at version `18.3.1` are installed (they are listed as optional peerDependencies and may need explicit installation).
- Running `npm run dev` starts the Vite dev server at `http://localhost:5173`.

### 3. App renders without runtime errors

**User story:** As a developer, I want the app to load in the browser without console errors so I can verify the UI matches the Figma design.

**Acceptance criteria:**
- The root `App.tsx` renders the `Sidebar` and the default `AgentView` without crashing.
- No "Cannot find module" or "Failed to resolve import" errors appear in the Vite terminal output.
- No uncaught React errors appear in the browser console on initial load.

### 4. All views are navigable

**User story:** As a developer, I want to click through every sidebar nav item and have each view render correctly.

**Acceptance criteria:**
- Clicking "Overview" renders `AgentView` (the chat/agent interface).
- Clicking "Outreach" renders `OutreachView` (empty state with "No drafts yet" message).
- Clicking "Professors" renders `ProfessorsView` (table of 6 professors).
- Clicking "Compose" renders `ComposeView` (email compose card with Dr. Robert Kim draft).
- Clicking the user row at the bottom of the sidebar renders `ProfileView`.
- The "Back" button in `ProfileView` returns to `AgentView`.

### 5. Agent interaction works

**User story:** As a developer, I want the mock agent flow to work end-to-end so I can demo the core feature.

**Acceptance criteria:**
- Typing a message and pressing Enter (or clicking the send button) in `AgentView` adds a user message bubble.
- The agent shows a thinking state (spinner + tool steps) before responding.
- After the mock delay, the agent response appears with the "Review drafts in Outreach" button.
- Clicking that button navigates to `OutreachView` and shows the 5 mock draft cards.
- Each draft card can be edited (click body to edit) and sent (click Send button).

### 6. No regressions to existing code

**User story:** As a developer, I want the existing Figma-exported code to remain unchanged so the UI stays pixel-perfect.

**Acceptance criteria:**
- No component files in `src/app/components/` are modified.
- No style files in `src/styles/` are modified.
- `App.tsx`, `main.tsx`, `vite.config.ts`, and `package.json` are only modified if strictly required to fix a blocking issue (e.g., adding `react`/`react-dom` as direct dependencies).
- The visual output matches the original Figma design.
