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
// Pipeline helpers (non-streaming variant for testing — duplicated from
// tests/end_to_end.ts. Lift into shared `runtime.ts` when both call sites
// would benefit from changes propagating.)
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
    max_tokens: 1500,
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
// Single fixture input — change values here to test against different inputs.
// ============================================================================

const PROFESSOR: Professor = {
  id: "fixture_berkeley_1",
  name: "Dr. Sanjit Seshia",
  affiliation: "UC Berkeley",
  email: null,
  homepage: "https://people.eecs.berkeley.edu/~sseshia/",
  concepts: [
    { name: "formal methods", score: 0.81 },
    { name: "program synthesis", score: 0.74 },
    { name: "cyber-physical systems", score: 0.58 },
  ],
  recentPapers: [
    {
      title: "Inductive synthesis of distributed-system invariants from execution traces",
      year: 2024,
      abstract:
        "We present a CEGIS-based pipeline for inferring invariants of distributed protocols from finite trace samples. The synthesized invariants are verified against TLA+ models and explored in case studies on Raft and Paxos variants.",
      url: "https://example.org/papers/cegis-distributed",
    },
  ],
  matchScore: 0.84,
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

const RESEARCH_INTERESTS = ["program synthesis", "distributed systems"]

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
  console.log(`body:`)
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
    voice: "conversational",
    length: "moderate",
    traits: ["mentions_specific_paper", "asks_genuine_question", "avoids_buzzwords"],
    ...phrases,
  }

  const user: UserProfile = {
    fullName: "Sid Balaji",
    university: "California Polytechnic State University, San Luis Obispo",
    major: "Computer Science",
    gpa: 3.7,
    researchInterests: RESEARCH_INTERESTS,
    shortBio:
      "CS junior at Cal Poly, focused on systems and verification. Looking for a research role for fall 2026.",
    experience: EXPERIENCE,
    tone,
  }

  const draft = await draftEmail({
    user,
    professor: PROFESSOR,
    opportunity: "research",
  })

  printDraft(draft)
}

main().catch(err => {
  console.error("[fatal]", err)
  process.exit(1)
})
