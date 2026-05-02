# ioia — CLAUDE.md

Outreach agent for students. Helps them find professors and write cold emails that don't sound like cold emails.

This file is the source of truth for how to work in this repo. Read it before writing code.

---

## What we're building

A web app where a student:

1. Uploads a resume + a writing sample → we extract a structured profile (interests, experience, tone).
2. Picks an opportunity type (research, internship) and a target university.
3. Gets a list of relevant professors with recent papers and concept matches.
4. Reviews an AI-drafted cold email per professor that reflects their voice and references real work.
5. Sends it via Gmail (demo: `mailto:` link), and tracks state on a dashboard.

This is a 12-hour hackathon build. The deliverable is a video demo. Optimize for **demo legibility and shipped polish**, not production hardness.

---

## Stack

- **Next.js 15** (App Router, TypeScript, React 19)
- **Tailwind v4** for styling, **shadcn/ui** for components
- **Anthropic TS SDK** (`@anthropic-ai/sdk`) — Claude is the only LLM provider
- **Vercel AI SDK** for streaming UI where it helps
- **Zod** for every cross-boundary schema
- **OpenAlex REST API** for professor/research discovery
- **npm**, deployed on Vercel

No Python. No second LLM provider. No database for MVP — seed data lives in `data/seed/` as JSON, runtime state lives in memory or `localStorage`.

---

## Repo layout

```
/
├── app/
│   ├── onboarding/        # resume upload + writing sample
│   ├── dashboard/         # sent, replies, follow-ups (mocked state OK)
│   ├── search/            # professor results + email composer
│   └── api/
│       ├── extract-profile/   # POST: resume PDF + writing sample → UserProfile
│       ├── find-professors/   # POST: interests + university → Professor[]
│       └── draft-email/       # POST: UserProfile + Professor → EmailDraft (stream)
├── lib/
│   ├── claude.ts          # Anthropic client wrapper
│   ├── openalex.ts        # OpenAlex query helpers
│   ├── prompts/           # system prompts as TS consts (one file per agent)
│   └── schemas/           # Zod schemas — single source of truth for shapes
├── data/
│   └── seed/              # pre-indexed professors for SLO, Berkeley, UCLA
├── components/            # UI components (shadcn lives in components/ui)
└── CLAUDE.md              # you are here
```

---

## The four core schemas

These are contracts. If you change them, ping the team. Defined in `lib/schemas/`.

### `UserProfile`
What we know about the student.
```ts
{
  name: string
  email: string
  school: string
  interests: string[]              // ["program synthesis", "distributed systems"]
  experience: ExperienceItem[]     // structured from resume
  goals: string                    // free text, what they want
  tone: TonePr ofile                // extracted from writing sample
}
```

### `TonePr ofile`
Extracted once at onboarding. Injected into every email-writer call.
```ts
{
  formality: "casual" | "neutral" | "formal"
  sentenceLength: "short" | "medium" | "long"
  contractions: boolean
  hedging: "low" | "medium" | "high"
  signaturePhrases: string[]       // recurring constructions from the sample
  avoidPhrases: string[]           // things they would never say
}
```

### `Professor`
One row of search results.
```ts
{
  id: string                       // OpenAlex ID
  name: string
  affiliation: string
  email: string | null             // best-effort — null is OK, we surface it
  homepage: string | null
  concepts: { name: string; score: number }[]
  recentPapers: {
    title: string
    year: number
    abstract: string | null
    url: string
  }[]
  matchScore: number               // 0–1, how well they match user interests
}
```

### `EmailDraft`
What the writer returns.
```ts
{
  subject: string
  body: string
  citations: { claim: string; source: "paper" | "homepage" | "profile"; ref: string }[]
  confidence: "high" | "medium" | "low"
  warnings: string[]               // e.g. "no recent papers found", "email guessed from pattern"
}
```

**Rule:** Every API route validates input and output with Zod. No `any`. No untyped JSON crossing a boundary.

---

## Agents (really: prompted Claude calls)

We have three logical "agents." None of them are agentic loops — they're single-shot Claude calls with structured output. Don't overbuild this.

### 1. Profile extractor (`/api/extract-profile`)
- Model: `claude-haiku-4-5`
- Input: resume PDF (as document block, no OCR library needed) + writing sample (text)
- Output: `UserProfile` (validated)
- Prompt lives in `lib/prompts/extract-profile.ts`

### 2. Professor finder (`/api/find-professors`)
- **Not a Claude call.** This is OpenAlex queries + ranking.
- Input: interests, university, opportunity type
- Output: `Professor[]`
- For the demo, prefer seed data in `data/seed/` over live OpenAlex calls. Live calls are fine but slower on camera.

### 3. Email writer (`/api/draft-email`)
- Model: `claude-sonnet-4-5` (upgrade to Opus if quality demands it)
- Input: `UserProfile` + `Professor` + opportunity type + optional user notes
- Output: `EmailDraft` (streamed to UI for the typing effect)
- Prompt lives in `lib/prompts/draft-email.ts` — **this prompt is the product**, treat it accordingly

---

## Email writer prompt — design notes

The system prompt for `draft-email` composes three things:

1. **Etiquette block** — static constant in `lib/prompts/etiquette.ts`. Norms for emailing professors: subject line conventions, paper references, length (under 150 words for research outreach), the ask, signature. Don't compute this. It's a constant.
2. **Tone block** — interpolated from `UserProfile.tone`. Tells Claude to mirror specific style traits.
3. **Context block** — the professor's recent papers and the user's relevant experience.

**Hard rules for the writer (encode these in the prompt):**
- Reference one specific recent paper by title — never generic "I read your work."
- Connect to one specific item from the user's experience — never generic "I'm interested in your field."
- Maximum 150 words for research outreach, 180 for internship.
- No em-dashes. No "I hope this email finds you well." No "I am reaching out because."
- If the professor has no recent papers in the user's interest area, return `confidence: "low"` and a warning.
- Subject line: 4–8 words, specific, no clickbait.

**Iterate on this prompt with real test cases.** Budget time for it. Quality of this one file determines whether the demo works.

---

## OpenAlex usage

OpenAlex is free, no key required, but be polite — pass an email in the User-Agent.

- Base URL: `https://api.openalex.org`
- Author search: `/authors?filter=last_known_institution.id:I<id>,concepts.id:C<id>`
- Get institution IDs once, hardcode them. SLO, Berkeley, UCLA only for the demo.
- Concept matching: pull author's top concepts, score against user's interests via simple overlap or embedding similarity (don't over-engineer).

Helpers go in `lib/openalex.ts`. Cache aggressively — hit OpenAlex once per university per concept and persist to `data/seed/<university>.json`.

**Email addresses are NOT in OpenAlex.** Best-effort approach:
1. Check the author's homepage URL if present.
2. Try the university's `firstname.lastname@domain` pattern.
3. If both fail, surface `email: null` in the UI and tell the user to find it.

Do not scrape faculty pages live. Pre-seed.

---

## Frontend conventions

- App Router, server components by default, `"use client"` only where needed (forms, streaming, interactivity).
- shadcn/ui for primitives. Don't reinvent buttons.
- Tailwind only — no CSS modules, no styled-components.
- Streaming responses use the Vercel AI SDK's `useChat` / `useCompletion` patterns or raw `ReadableStream` consumption.
- Loading states must exist for every async action. The demo will show them.
- No `localStorage` reads in render — wrap in `useEffect`.

**Dashboard data is mocked for the demo.** Put a `data/mock-dashboard.ts` with believable sent emails, replies, and follow-up state. The dashboard page reads from it. We are not building real send-tracking in 12 hours.

---

## API route conventions

Every route in `app/api/*/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { InputSchema, OutputSchema } from "@/lib/schemas/..."

export async function POST(req: NextRequest) {
  const body = await req.json()
  const input = InputSchema.parse(body)        // throws → 400
  const result = await doTheThing(input)
  return NextResponse.json(OutputSchema.parse(result))
}
```

Errors return `{ error: string }` with appropriate status. No stack traces to client.

Streaming routes return a `ReadableStream` and the client uses the AI SDK to consume it.

---

## Claude API usage

Wrapper lives in `lib/claude.ts`. Always go through it.

- Use **tool use / JSON mode** for any structured output. Pass the Zod schema converted to JSON Schema.
- Set `max_tokens` explicitly per call. Profile extraction: 1500. Email draft: 800.
- Use Haiku for extraction/classification, Sonnet for generation. Don't use Opus unless you've measured Sonnet falling short.
- Stream the email draft to the client. Other calls can be non-streaming.
- The API key is `ANTHROPIC_API_KEY` in `.env.local`. Never commit it. Never log it.

---

## Gmail integration

Faked for the demo. Three things:

1. A "Connect Gmail" button on the dashboard that opens a modal, spinners for ~1.2s, flips to "Connected ✓" with a Google logo and a fake account email. State persists in `localStorage`.
2. The "Send" button on the email composer generates a `mailto:` link with subject and body pre-filled and opens it.
3. After "send," optimistically add the email to the mocked dashboard state.

Real OAuth is out of scope. If asked in the demo: "OAuth is wired up server-side, this is the demo path."

---

## Demo path — what must work end-to-end

In order, the video shows:

1. **Onboarding** — paste resume PDF, paste writing sample → see extracted profile JSON render in a card. (~15s)
2. **Search** — pick a university, see professor cards with match scores and recent papers. (~20s)
3. **Compose** — click a professor, watch email stream in, edit one line, click send → mailto opens. (~25s)
4. **Dashboard** — show sent count, one mocked reply, follow-up suggestion. (~15s)
5. **Reply flow (mocked)** — flash a "reply received → calendar slot → prep mode with behavioral + DSA tips" screen. (~15s)

Things 4 and 5 can be entirely mocked state. They need to *render correctly*, not *function correctly*.

---

## What we are NOT building

- Real Gmail OAuth or send
- A database
- User auth or accounts
- Multiple users / collaboration
- Real follow-up scheduling logic
- Live calendar integration
- A mobile app
- Tests beyond a few schema validation sanity checks

Anyone working on the above without explicit team agreement is off-mission.

---

## Roles (for context, not gatekeeping)

- **Rahul** — frontend, UI, dashboard. Owns `app/` (excluding API routes) and `components/`.
- **Sid** — OpenAlex, professor finding, tone extraction, prompt iteration. Owns `lib/openalex.ts`, `data/seed/`, `lib/prompts/`.
- **Aswath** — resume parsing, email-drafting route, mailto, fake Gmail modal. Owns `app/api/extract-profile`, `app/api/draft-email`, the connect-gmail UX.

Anyone can jump anywhere if blocked. Schemas in `lib/schemas/` are the integration contract — change them only with team agreement.

---

## Working with this codebase as an LLM

If you are Claude (or another model) editing this repo:

1. **Read the relevant schema in `lib/schemas/` before changing any data shape.** Update the schema first, then the code that uses it.
2. **Don't add new dependencies without a clear reason.** Stack is fixed above.
3. **Don't add a database, auth, or a Python service.** Out of scope.
4. **Don't refactor for "production readiness."** This is a hackathon. Working > clean.
5. **When editing prompts in `lib/prompts/`, preserve the existing structure** (etiquette block, tone block, context block for the email writer). Hard rules in the email writer prompt are intentional — don't soften them.
6. **Mocked dashboard data is intentional.** Don't wire it to a real backend.
7. **The mailto link is intentional.** Don't replace with real send.
8. **Run `npm run dev` to verify changes.** Run `npm run build` before claiming a feature is done — type errors block the demo.
9. **If you find yourself writing more than ~150 lines for a single feature, stop and ask.** Probably overbuilding.

---

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # must pass before merging
npm run lint
```

Environment:
```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
OPENALEX_EMAIL=team@example.com   # for OpenAlex User-Agent
```

---

## North star

A student opens ioia, gives it a resume and a writing sample, and 90 seconds later has three personalized cold emails ready to send to professors whose work actually matches their interests. Every decision in this repo is downstream of that.