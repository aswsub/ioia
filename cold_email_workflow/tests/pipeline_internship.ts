import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"

import {
  EXTRACT_TONE_SYSTEM,
  buildToneExtractorUserMessage,
  TONE_PROFILE_TOOL,
} from "../prompts/extract_tone"
import {
  EMAIL_DRAFT_TOOL,
  buildDraftEmailSystem,
  buildDraftEmailUserMessage,
  maxTokensFor,
  type DraftEmailInput,
} from "../prompts/draft_email"
import type { ToneProfile } from "../prompts/tone"
import type { ExperienceItem, Professor, UserProfile } from "../prompts/context"
import {
  ExtractedTonePhrasesSchema,
  EmailDraftSchema,
  assertDraftEmailInputViable,
} from "../schemas"

type ExtractedTonePhrases = z.infer<typeof ExtractedTonePhrasesSchema>
type EmailDraft = z.infer<typeof EmailDraftSchema>

const client = new Anthropic()

// ============================================================================
// Pipeline helpers (non-streaming variant, mirrors tests/pipeline.ts).
// ============================================================================

async function extractTonePhrases(sample: string): Promise<ExtractedTonePhrases> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 800,
    system: EXTRACT_TONE_SYSTEM,
    tools: [TONE_PROFILE_TOOL as unknown as Anthropic.Messages.Tool],
    tool_choice: { type: "tool", name: TONE_PROFILE_TOOL.name },
    messages: [{ role: "user", content: buildToneExtractorUserMessage(sample) }],
  })

  if (response.stop_reason === "max_tokens") {
    throw new Error("tone extractor truncated by max_tokens cap.")
  }
  if (response.stop_reason === "refusal") {
    throw new Error("tone extractor refused.")
  }

  for (const block of response.content) {
    if (block.type === "tool_use" && block.name === TONE_PROFILE_TOOL.name) {
      return ExtractedTonePhrasesSchema.parse(block.input)
    }
  }
  throw new Error("tone extractor did not return a tool_use block.")
}

async function draftEmail(input: DraftEmailInput): Promise<EmailDraft> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: maxTokensFor(input.opportunity),
    system: buildDraftEmailSystem(input),
    tools: [EMAIL_DRAFT_TOOL as unknown as Anthropic.Messages.Tool],
    tool_choice: { type: "tool", name: EMAIL_DRAFT_TOOL.name },
    messages: [{ role: "user", content: buildDraftEmailUserMessage(input) }],
  })

  if (response.stop_reason === "max_tokens") {
    throw new Error("email writer truncated by max_tokens cap.")
  }
  if (response.stop_reason === "refusal") {
    throw new Error("email writer refused.")
  }

  for (const block of response.content) {
    if (block.type === "tool_use" && block.name === EMAIL_DRAFT_TOOL.name) {
      return EmailDraftSchema.parse(block.input)
    }
  }
  throw new Error("email writer did not return a tool_use block.")
}

// ============================================================================
// Single fixture input — internship outreach.
//
// The Professor type is reused here as the "company / team contact" shape:
//   - name         -> recipient (hiring manager, eng lead, CEO)
//   - affiliation  -> company
//   - concepts     -> team's technical areas
//   - recentPapers -> blog posts, launches, or talks (rendered with
//                     internship-appropriate labels by renderContextBlock
//                     when opportunity = "internship")
// ============================================================================

const COMPANY: Professor = {
  id: "fixture_linear_1",
  name: "Karri Saarinen",
  affiliation: "Linear",
  email: null,
  homepage: "https://linear.app/about",
  concepts: [
    { name: "realtime sync", score: 0.85 },
    { name: "API design", score: 0.72 },
    { name: "distributed systems", score: 0.65 },
  ],
  recentPapers: [
    {
      title: "Scaling the Linear Sync Engine",
      year: 2024,
      abstract:
        "A deep dive into how Linear rebuilt its realtime sync engine from scratch to handle larger workspaces, focusing on the tradeoffs between client-side caching, server-side reconciliation, and conflict resolution at scale.",
      url: "https://linear.app/blog/scaling-the-linear-sync-engine",
    },
  ],
  matchScore: 0.78,
}

const WRITING_SAMPLE = `Built a thing this weekend that scrapes professor pages and dumps a CSV. Honestly thought it'd take 2 hours, ended up shipping at 4am. The gnarly part was OpenAlex rate limits — I ended up batching with backoff and that fixed it. Not perfect but it works on three universities.`

const EXPERIENCE: ExperienceItem[] = [
  {
    title: "Software Engineering Intern",
    org: "Stripe",
    description:
      "Built a CSV-to-Stripe import pipeline used by 200+ merchants. Cut onboarding time from 3 days to 4 hours. Stack: TypeScript, Postgres, the Stripe API.",
  },
]

const RESEARCH_INTERESTS = ["realtime sync", "developer tools"]

// ============================================================================
// Run
// ============================================================================

function printDraft(draft: EmailDraft): void {
  console.log(`subject:    ${draft.subject}`)
  console.log(`confidence: ${draft.confidence}`)
  if (draft.warnings.length > 0) {
    console.log(`warnings:`)
    for (const w of draft.warnings) console.log(`  - ${w}`)
  }
  console.log(`citations (${draft.citations.length}):`)
  for (const c of draft.citations) {
    console.log(`  [${c.source}] ${c.claim}`)
    console.log(`          ref: ${c.ref}`)
  }
  const wordCount = draft.body.trim().split(/\s+/).length
  console.log(`body (${wordCount} words):`)
  console.log("-".repeat(70))
  for (const line of draft.body.split("\n")) console.log(line)
  console.log("-".repeat(70))
}

async function main(): Promise<void> {
  assertDraftEmailInputViable({
    experience: EXPERIENCE,
    researchInterests: RESEARCH_INTERESTS,
  })

  const phrases = await extractTonePhrases(WRITING_SAMPLE)

  const tone: ToneProfile = {
    voice: "direct",
    length: "concise",
    traits: ["mentions_specific_paper", "data_driven_language", "avoids_buzzwords"],
    ...phrases,
  }

  const user: UserProfile = {
    fullName: "Sid Balaji",
    university: "California Polytechnic State University, San Luis Obispo",
    major: "Computer Science",
    gpa: 3.7,
    researchInterests: RESEARCH_INTERESTS,
    shortBio:
      "CS junior at Cal Poly. Looking for a SWE internship for summer 2026, ideally on a team building developer tooling or realtime systems.",
    experience: EXPERIENCE,
    tone,
  }

  const draft = await draftEmail({
    user,
    professor: COMPANY,
    opportunity: "internship",
  })

  printDraft(draft)
}

main().catch(err => {
  console.error("[fatal]", err)
  process.exit(1)
})
