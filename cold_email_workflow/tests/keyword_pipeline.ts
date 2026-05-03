import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"

import {
  EXTRACT_KEYWORDS_SYSTEM,
  buildExtractKeywordsUserMessage,
  ExtractedKeywordsSchema,
  type ExtractedKeywords,
} from "../prompts/extract_keywords"
import {
  EMAIL_DRAFT_TOOL,
  buildDraftEmailSystem,
  buildDraftEmailUserMessage,
  maxTokensFor,
  type DraftEmailInput,
} from "../prompts/draft_email"
import type { ToneProfile } from "../prompts/tone"
import type { Professor, UserProfile } from "../prompts/context"
import { EmailDraftSchema } from "../schemas"

type EmailDraft = z.infer<typeof EmailDraftSchema>

// ============================================================================
// Test plan
// ----------------------------------------------------------------------------
// Simulates a user typing into the AgentView outreach text box.
//
// For each fixture prompt:
//   1. Run extractKeywordsFromPrompt against the live Haiku model.
//   2. Assert the extracted research areas / institutions match what a human
//      reading the prompt would expect (case-insensitive substring match).
//   3. Assert opportunityType is the expected value.
//
// Then for ONE representative prompt, plug the extracted keywords into the
// email-drafting prompt with a fixture professor and assert that:
//   - the body references the extracted research area
//   - the EmailDraft schema validates
//
// We use a fixture professor (no live OpenAlex call) so the test is
// deterministic enough for hackathon CI. The OpenAlex search itself is
// already exercised by tests/end_to_end.ts.
// ============================================================================

const client = new Anthropic()

type Case = {
  name: string
  prompt: string
  // For all string-array fields: assertion is "at least one variant from each
  // group must appear (case-insensitive substring)". Use [] to assert empty.
  // Use undefined to skip the assertion entirely (not all cases care about
  // every field).
  expectAreas: string[]
  expectInstitutions: string[]
  expectCompanies?: string[]
  expectRoleHints?: string[]
  expectOpportunity: "research" | "internship"
}

const CASES: Case[] = [
  // ── Baseline cases (must keep passing) ─────────────────────────────────────
  {
    name: "research / Berkeley / program synthesis",
    prompt:
      "Looking for professors at UC Berkeley working on program synthesis or formal verification. I want to do undergrad research this fall.",
    expectAreas: ["program synthesis", "formal verification"],
    expectInstitutions: ["berkeley", "uc berkeley"],
    expectCompanies: [],
    expectOpportunity: "research",
  },
  {
    name: "research / multi-school / NLP+LLMs",
    prompt: "Find ML professors at MIT and Stanford researching LLMs and RLHF.",
    expectAreas: ["llm", "rlhf"],
    expectInstitutions: ["mit", "stanford"],
    expectCompanies: [],
    expectOpportunity: "research",
  },
  {
    name: "internship / no school / distributed systems",
    prompt:
      "I'm a CS junior looking for a summer internship working on distributed systems or databases.",
    expectAreas: ["distributed systems", "database"],
    expectInstitutions: [],
    expectCompanies: [],
    expectOpportunity: "internship",
  },
  {
    name: "research / CMU / RL",
    prompt: "Who works on reinforcement learning at CMU?",
    expectAreas: ["reinforcement learning"],
    expectInstitutions: ["cmu", "carnegie mellon"],
    expectCompanies: [],
    expectOpportunity: "research",
  },

  // ── Edge cases the v2 prompt explicitly targets ────────────────────────────
  {
    // Industry research: "research at <company>" should still be internship.
    // Pre-v2 prompt got this wrong (defaulted to research because of the word).
    name: "industry research / OpenAI",
    prompt: "Looking for AI research opportunities at OpenAI.",
    expectAreas: ["ai", "artificial intelligence"],
    expectInstitutions: [],
    expectCompanies: ["openai"],
    expectOpportunity: "internship",
  },
  {
    // Origin school must NOT bleed into institutions.
    // Cal Poly is the student's school, not a target.
    name: "internship / origin school / Cal Poly + FAANG",
    prompt: "I'm at Cal Poly looking for SWE internships at any FAANG company.",
    expectAreas: [],
    expectInstitutions: [],
    expectCompanies: [],
    expectRoleHints: ["software engineer"],
    expectOpportunity: "internship",
  },
  {
    // "co-op" is a strong internship signal; previously missing from the rule.
    name: "internship / co-op / infra",
    prompt: "Looking for a co-op for spring 2026 working on infra at a startup.",
    expectAreas: ["infra"],
    expectInstitutions: [],
    expectCompanies: [],
    expectOpportunity: "internship",
  },
  {
    // Conflict — company mentioned but the target is the professor.
    // Stanford is the target; Google is incidental.
    name: "research / Stanford profs who consult at Google",
    prompt: "Find Stanford professors who consult at Google on RL.",
    expectAreas: ["reinforcement learning"],
    expectInstitutions: ["stanford"],
    expectCompanies: [],
    expectOpportunity: "research",
  },
  {
    // Return-offer phrasing is internship.
    name: "internship / return offer / Notion",
    prompt: "I want to email someone at Notion about a return offer.",
    expectAreas: [],
    expectInstitutions: [],
    expectCompanies: ["notion"],
    expectOpportunity: "internship",
  },
  {
    // PhD advisor is unambiguously research.
    name: "research / PhD advisor / UCLA / NLP",
    prompt: "Looking for a PhD advisor at UCLA in NLP.",
    expectAreas: ["nlp"],
    expectInstitutions: ["ucla"],
    expectCompanies: [],
    expectOpportunity: "research",
  },
  {
    // Vague prompt — defaults to research per Rule 4.
    name: "vague / topic only",
    prompt: "Who works on reinforcement learning?",
    expectAreas: ["reinforcement learning"],
    expectInstitutions: [],
    expectCompanies: [],
    expectOpportunity: "research",
  },
  {
    // Same school as both origin and target — should appear once.
    name: "edge / origin == target / MIT",
    prompt: "I'm an MIT undergrad looking for MIT labs working on robotics.",
    expectAreas: ["robotics"],
    expectInstitutions: ["mit"],
    expectCompanies: [],
    expectOpportunity: "research",
  },
]

// ============================================================================
// Frontend extractor — copied verbatim from src/lib/claude.ts so the test runs
// the SAME prompt the browser ships with. If you change the extraction shape,
// update both call sites (or lift into a shared helper).
// ============================================================================

async function extractKeywordsFromPrompt(prompt: string): Promise<ExtractedKeywords> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 400,
    system: EXTRACT_KEYWORDS_SYSTEM,
    messages: [{ role: "user", content: buildExtractKeywordsUserMessage(prompt) }],
  })

  const text = response.content.find(b => b.type === "text")?.text ?? "{}"
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim()
  return ExtractedKeywordsSchema.parse(JSON.parse(cleaned))
}

async function draftEmail(input: DraftEmailInput): Promise<EmailDraft> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: maxTokensFor(input.target.kind),
    system: buildDraftEmailSystem(input),
    tools: [EMAIL_DRAFT_TOOL as unknown as Anthropic.Messages.Tool],
    tool_choice: { type: "tool", name: EMAIL_DRAFT_TOOL.name },
    messages: [{ role: "user", content: buildDraftEmailUserMessage(input) }],
  })

  if (response.stop_reason === "max_tokens") {
    throw new Error("email writer truncated by max_tokens cap.")
  }
  for (const block of response.content) {
    if (block.type === "tool_use" && block.name === EMAIL_DRAFT_TOOL.name) {
      return EmailDraftSchema.parse(block.input)
    }
  }
  throw new Error("email writer did not return a tool_use block.")
}

// ============================================================================
// Assertions
// ============================================================================

function lower(s: string): string {
  return s.toLowerCase()
}

// Each `needles` entry is a group of acceptable variants — the haystack must
// contain at least one variant from each group. e.g. ["cmu", "carnegie mellon"]
// passes if the haystack contains either spelling.
function assertContainsAny(
  label: string,
  haystack: string[],
  needles: string[],
): void {
  if (needles.length === 0) return
  const hay = haystack.map(lower)
  if (!needles.some(n => hay.some(h => h.includes(lower(n))))) {
    throw new Error(
      `${label}: expected to find any of [${needles.join(", ")}] in [${haystack.join(", ")}]`,
    )
  }
}

function assertEmpty(label: string, haystack: string[]): void {
  if (haystack.length > 0) {
    throw new Error(`${label}: expected empty array, got [${haystack.join(", ")}]`)
  }
}

// ============================================================================
// Fixture professor for the end-to-end leg of the test
// ============================================================================

const PROFESSOR: Professor = {
  id: "fixture_berkeley_seshia",
  name: "Dr. Sanjit Seshia",
  affiliation: "UC Berkeley",
  email: null,
  homepage: "https://people.eecs.berkeley.edu/~sseshia/",
  concepts: [
    { name: "formal methods", score: 0.81 },
    { name: "program synthesis", score: 0.74 },
  ],
  recentPapers: [
    {
      title:
        "Inductive synthesis of distributed-system invariants from execution traces",
      year: 2024,
      abstract:
        "We present a CEGIS-based pipeline for inferring invariants of distributed protocols from finite trace samples.",
      url: "https://example.org/papers/cegis-distributed",
    },
  ],
  matchScore: 0.84,
}

const FIXTURE_USER_BASE: Omit<UserProfile, "researchInterests" | "tone"> = {
  fullName: "Sid Balaji",
  university: "California Polytechnic State University, San Luis Obispo",
  major: "Computer Science",
  gpa: 3.7,
  shortBio:
    "CS junior at Cal Poly, focused on systems and verification. Looking for a research role for fall 2026.",
  experience: [
    {
      title: "Software Engineering Intern",
      org: "Stripe",
      description:
        "Built a CSV-to-Stripe import pipeline used by 200+ merchants. Cut onboarding time from 3 days to 4 hours.",
    },
  ],
}

const FIXTURE_TONE: ToneProfile = {
  voice: "conversational",
  length: "moderate",
  traits: ["mentions_specific_paper", "asks_genuine_question", "avoids_buzzwords"],
  signaturePhrases: ["I noticed", "ended up"],
  avoidPhrases: ["I am writing to inquire", "leverage"],
  confidence: "medium",
}

// ============================================================================
// Run
// ============================================================================

async function runCase(c: Case): Promise<ExtractedKeywords> {
  console.log(`\n[case] ${c.name}`)
  console.log(`  prompt: "${c.prompt}"`)

  const out = await extractKeywordsFromPrompt(c.prompt)
  console.log(`  extracted: ${JSON.stringify(out)}`)

  if (c.expectAreas.length === 0) {
    // Allow "any" — some prompts have no concrete topic.
  } else {
    assertContainsAny(`${c.name} → researchAreas`, out.researchAreas, c.expectAreas)
  }

  if (c.expectInstitutions.length === 0) {
    assertEmpty(`${c.name} → institutions`, out.institutions)
  } else {
    assertContainsAny(
      `${c.name} → institutions`,
      out.institutions,
      c.expectInstitutions,
    )
  }

  if (c.expectCompanies !== undefined) {
    if (c.expectCompanies.length === 0) {
      assertEmpty(`${c.name} → companies`, out.companies)
    } else {
      assertContainsAny(`${c.name} → companies`, out.companies, c.expectCompanies)
    }
  }

  if (c.expectRoleHints !== undefined && c.expectRoleHints.length > 0) {
    assertContainsAny(`${c.name} → roleHints`, out.roleHints, c.expectRoleHints)
  }

  if (out.opportunityType !== c.expectOpportunity) {
    throw new Error(
      `${c.name}: expected opportunityType=${c.expectOpportunity}, got ${out.opportunityType}`,
    )
  }
  console.log(`  ✓ assertions passed`)
  return out
}

async function main(): Promise<void> {
  console.log("=".repeat(72))
  console.log("ioia outreach-box → keyword pipeline test")
  console.log("=".repeat(72))

  // Run all extraction cases.
  const results: ExtractedKeywords[] = []
  for (const c of CASES) {
    results.push(await runCase(c))
  }

  // Plug the first extraction (Berkeley / program synthesis) into the email
  // drafter to confirm the keywords actually flow into the prompt.
  const seed = results[0]
  const userProfile: UserProfile = {
    ...FIXTURE_USER_BASE,
    researchInterests: seed.researchAreas,
    tone: FIXTURE_TONE,
  }

  console.log("\n" + "=".repeat(72))
  console.log("Drafting email with extracted keywords + fixture professor…")
  console.log("=".repeat(72))
  const draft = await draftEmail({
    user: userProfile,
    target: { kind: "research", professor: PROFESSOR },
  })

  console.log(`\nsubject: ${draft.subject}`)
  console.log(`confidence: ${draft.confidence}`)
  console.log("body:")
  console.log("-".repeat(72))
  console.log(draft.body)
  console.log("-".repeat(72))

  // The drafter MUST connect to one of the user's research interests. If none
  // of the extracted areas appears anywhere in subject/body, the wiring is
  // broken — keywords are being extracted but not reaching the draft prompt.
  const haystack = `${draft.subject}\n${draft.body}`.toLowerCase()
  const referenced = seed.researchAreas.some(a => haystack.includes(a.toLowerCase()))
  if (!referenced) {
    throw new Error(
      `email body references none of the extracted research areas [${seed.researchAreas.join(", ")}]; keyword → draft wiring is broken`,
    )
  }
  console.log(
    `✓ draft references at least one extracted research area (${seed.researchAreas.find(a => haystack.includes(a.toLowerCase()))})`,
  )

  console.log("\n" + "=".repeat(72))
  console.log(`PASS — ${CASES.length} extraction cases + 1 draft case`)
  console.log("=".repeat(72))
}

main().catch(err => {
  console.error("\n[fail]", err instanceof Error ? err.message : err)
  process.exit(1)
})
