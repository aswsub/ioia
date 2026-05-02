# Coding Standards

## General

- Keep components small and focused. If a component exceeds ~150 lines, split it.
- Put reusable helper functions and sub-components in their own files.
- Prefer responsive layouts using flexbox and grid. Only use absolute positioning when necessary.
- Never introduce a new dependency without checking if an existing one already covers the need.

## TypeScript

- Always type component props with an explicit interface or type alias.
- Avoid `any`. Use `unknown` and narrow it, or define a proper type.
- Export types and interfaces that are shared across components from `mock-data.ts` or a dedicated `types.ts` file.

## Styling

- Use Tailwind utility classes for layout and spacing.
- Use inline `style` props for design-token values (colors, font sizes, border colors) that come directly from the Figma design — this preserves pixel-perfect fidelity.
- Do not add a `tailwind.config.js` — this project uses Tailwind v4 which is configured via CSS.
- Theme tokens live in `src/styles/theme.css`. Reference them via CSS variables (e.g., `var(--font-sans)`).

## Components

- Radix UI primitives are already installed. Use them for accessible interactive elements (dialogs, dropdowns, tooltips, etc.).
- shadcn/ui-style components live in `src/app/components/ui/`. Use and extend these before writing new primitives.
- The `figma:asset/` import scheme (e.g., `import logo from "figma:asset/ioia.png"`) is resolved by the custom Vite plugin in `vite.config.ts`. Assets must live in `src/assets/`.

## State management

- Local component state with `useState` is preferred for UI state.
- Lift state to `App.tsx` only when two or more sibling views need to share it (e.g., `outreachDrafts` passed from AgentView → OutreachView).
- No global state library is needed at current scale.

## Mock data

- All mock data lives in `src/app/components/mock-data.ts`.
- When adding new features, extend the types and mock arrays in that file rather than hardcoding data inline in components.
