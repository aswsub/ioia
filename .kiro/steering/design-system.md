---
inclusion: manual
---

# Design System

This dashboard follows a strict minimalist aesthetic derived from the original Figma design. Adhere to these rules when making any visual changes.

## Typography

- Base font: `var(--font-sans)` (set in `src/styles/fonts.css`)
- Body text: 12–13px
- Labels and meta text: 10.5–11.5px
- Headings: 14–16px, `fontWeight: 500` or `600`
- Never use font weights above 600

## Color palette

| Token | Value | Usage |
|-------|-------|-------|
| Primary text | `#0a0a0a` | Headings, active nav items |
| Secondary text | `#525252` | Body, inactive nav |
| Muted text | `#a3a3a3` | Timestamps, meta, placeholders |
| Border | `#e5e5e5` | All dividers and card borders |
| Surface | `#fafafa` | Page background |
| White | `#ffffff` | Card and sidebar backgrounds |
| Active bg | `#f5f5f5` | Hovered/active nav items |
| Accent blue | `#3b82f6` | "Replied" status, links |
| Accent amber | `#f59e0b` | "Follow-up" status |

## Spacing

- Use 4px base unit. Common values: 4, 8, 12, 16, 20, 24px.
- Sidebar width: 176px (fixed, do not change).
- Card padding: 16–20px.

## Components

### Buttons
- No rounded-full buttons. Use `rounded` (4px) or `rounded-md` (6px).
- Primary action: dark fill (`#0a0a0a` bg, white text), small size (height ~28px).
- Ghost/secondary: transparent bg, `#525252` text, hover to `#fafafa` bg.

### Status badges
- Pill shape, small text (10–11px).
- Colors map to `OutreachStatus`: replied → blue, sent → dark, follow_up → amber, draft → gray.

### Cards
- White background, `1px solid #e5e5e5` border, `rounded-lg` (8px).
- Subtle shadow only when the card is elevated/interactive.

### Sidebar
- Fixed 176px width, white bg, right border `#e5e5e5`.
- Nav item font size: 12.5px.

## Do not
- Do not use bright or saturated colors outside the palette above.
- Do not add drop shadows to flat UI elements.
- Do not use border-radius larger than `rounded-xl` (12px).
- Do not add animations longer than 200ms for micro-interactions.
