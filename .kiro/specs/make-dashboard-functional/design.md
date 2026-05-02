# Design: Make Dashboard Functional Locally

## Problem

The project was exported from Figma Make. It has all the UI code in place but two structural issues prevent it from running locally:

1. **Missing asset file** — `Sidebar.tsx` imports `figma:asset/ioia.png`. The custom Vite plugin in `vite.config.ts` resolves this to `src/assets/ioia.png`, but that file doesn't exist yet (the source image is at `src/imports/ioia.png`).

2. **React not installed as a direct dependency** — `react` and `react-dom` are listed as `peerDependencies` with `optional: true`, which is a Figma Make convention. When running `npm install` in a standalone project (not inside a host app), these won't be installed automatically. The app will fail to start with a "Cannot find module 'react'" error.

## Solution

Both fixes are minimal and non-destructive:

### Fix 1 — Copy the logo to the assets directory

The Vite plugin resolves `figma:asset/<filename>` to `src/assets/<filename>`. The logo already exists at `src/imports/ioia.png`. We just need to copy it (or create a symlink) to `src/assets/ioia.png`.

```
src/
  assets/
    ioia.png   ← copy from src/imports/ioia.png
  imports/
    ioia.png   ← original, leave untouched
```

No code changes needed — the existing import in `Sidebar.tsx` will resolve correctly once the file is in place.

### Fix 2 — Install React as a direct dependency

Add `react` and `react-dom` as direct `dependencies` in `package.json` so they are installed when running `npm install` standalone:

```json
"dependencies": {
  "react": "18.3.1",
  "react-dom": "18.3.1",
  ...
}
```

They can remain in `peerDependencies` as well — that's fine and won't cause conflicts.

## What we are NOT changing

- No component files
- No style files  
- No Vite config (the figma asset resolver plugin is already correct)
- No Tailwind config
- No routing or state logic

## Verification steps

1. `npm install` completes with exit code 0
2. `npm run dev` starts without errors
3. Browser opens `http://localhost:5173` — sidebar renders with ioia logo
4. All 5 nav items render their respective views
5. Agent chat flow works: type → thinking → response → navigate to Outreach → 5 draft cards visible
