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
import type { ExperienceItem, UserProfile } from "../prompts/context"
import {
  ExtractedTonePhrasesSchema,
  EmailDraftSchema,
  assertDraftEmailInputViable,
  type Company,
  type CompanyContact,
} from "../schemas"
import { findCompany } from "../find_company"

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
    max_tokens: maxTokensFor(input.target.kind),
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
// Internship outreach scenarios. Each scenario picks a Company + Contact
// from the verified seed file via findCompany. Two scenarios verify the
// authorship-attribution branch:
//   1. Linear / Daniel Park — IC, but the talk's author is Tuomas Artman.
//      The model must NOT say "your talk." Should attribute to Tuomas
//      or "your team's."
//   2. Vercel / Lydia Mendez — IC. The streaming post's author is Lydia
//      Hallie. Same first name, different person. Authorship match is
//      exact-string, so the model should NOT conflate them.
// ============================================================================

type Scenario = {
  label: string
  query: string
  teamFocus: string
}

const SCENARIOS: Scenario[] = [
  {
    label: "Linear / Daniel Park (IC, talk author = Tuomas Artman)",
    query: "Linear sync engine internship",
    teamFocus: "Sync Engine",
  },
  {
    label: "Vercel / Lydia Mendez (IC, post author = Lydia Hallie — name-similarity canary)",
    query: "Vercel edge runtime",
    teamFocus: "Edge Runtime",
  },
]

function loadTarget(query: string): { company: Company; contact: CompanyContact } {
  const result = findCompany(query)
  const match = result.matches[0]
  if (!match) {
    throw new Error(
      `findCompany("${query}") returned no matches. Check cold_email_workflow/companies.json.`,
    )
  }
  const contact = match.company.contacts.find(c => c.id === match.suggestedContactId)
  if (!contact) {
    throw new Error(
      `Suggested contact id "${match.suggestedContactId}" not found in ${match.company.name}'s contacts.`,
    )
  }
  return { company: match.company, contact }
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

  // Tone extraction is shared across scenarios (same writing sample, same user).
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

  for (const scenario of SCENARIOS) {
    console.log("=".repeat(72))
    console.log(scenario.label)
    console.log("=".repeat(72))

    const { company, contact } = loadTarget(scenario.query)
    console.log(`recipient: ${contact.name} (${contact.role})`)
    const authoredByRecipient = company.notableWork.find(w => w.author === contact.name)
    const namedAuthors = company.notableWork
      .filter(w => w.author !== null)
      .map(w => `${w.title} -> ${w.author}`)
    console.log(`recipient authored notableWork: ${authoredByRecipient ? authoredByRecipient.title : "(none)"}`)
    if (namedAuthors.length > 0) {
      console.log(`named-author works in this company: ${namedAuthors.join(" | ")}`)
    }
    console.log()

    const draft = await draftEmail({
      user,
      target: {
        kind: "internship",
        company,
        contact,
        teamFocus: scenario.teamFocus,
      },
    })

    printDraft(draft)
    console.log()
  }
}

main().catch(err => {
  console.error("[fatal]", err)
  process.exit(1)
})
