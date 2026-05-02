import readline from "node:readline/promises"
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
import {
  TONE_VOICES,
  TONE_LENGTHS,
  TONE_TRAITS,
  type ToneProfile,
  type ToneVoice,
  type ToneLength,
  type ToneTrait,
} from "../prompts/tone"
import type {
  ExperienceItem,
  Professor,
  UserProfile,
  OpportunityType,
} from "../prompts/context"
import {
  ExtractedTonePhrasesSchema,
  EmailDraftSchema,
  assertDraftEmailInputViable,
} from "../schemas"

type ExtractedTonePhrases = z.infer<typeof ExtractedTonePhrasesSchema>
type EmailDraft = z.infer<typeof EmailDraftSchema>

const client = new Anthropic()
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

async function ask(prompt: string, defaultValue?: string): Promise<string> {
  const hint = defaultValue ? ` [${defaultValue}]` : ""
  const answer = (await rl.question(`${prompt}${hint}: `)).trim()
  return answer || defaultValue || ""
}

async function askMultiline(prompt: string, sentinel = "END"): Promise<string> {
  console.log(`${prompt} (type '${sentinel}' on its own line when done)`)
  const lines: string[] = []
  while (true) {
    const line = await rl.question("")
    if (line.trim() === sentinel) break
    lines.push(line)
  }
  return lines.join("\n").trim()
}

async function pickOne<T extends string>(
  label: string,
  options: readonly T[],
  defaultIdx: number,
): Promise<T> {
  console.log(`${label}:`)
  options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`))
  const raw = await ask(`Pick (1-${options.length})`, String(defaultIdx + 1))
  const idx = Math.max(0, Math.min(options.length - 1, parseInt(raw, 10) - 1))
  return options[idx]
}

async function pickMany<T extends string>(
  label: string,
  options: readonly T[],
  defaultPicks: T[],
): Promise<T[]> {
  console.log(`${label} (comma-separated indices, blank for none):`)
  options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`))
  const defaultStr = defaultPicks
    .map(p => options.indexOf(p) + 1)
    .filter(n => n > 0)
    .join(",")
  const raw = await ask(`Pick`, defaultStr || "(none)")
  if (raw === "(none)" || raw === "") return []
  const picked = raw
    .split(",")
    .map(s => parseInt(s.trim(), 10))
    .filter(n => Number.isFinite(n) && n >= 1 && n <= options.length)
    .map(n => options[n - 1])
  return Array.from(new Set(picked))
}

const DEFAULT_WRITING_SAMPLE = `Built a thing this weekend that scrapes professor pages and dumps a CSV. Honestly thought it'd take 2 hours, ended up shipping at 4am. The gnarly part was OpenAlex rate limits — I ended up batching with backoff and that fixed it. Not perfect but it works on three universities.`

// Fixtures — fictional professors with plausible-looking research areas.
// NOT real OpenAlex data. Replace with seed data once `data/seed/` is built.
const PROFESSORS: Professor[] = [
  {
    id: "fixture_slo_1",
    name: "Dr. Theresa Migler",
    affiliation: "California Polytechnic State University, San Luis Obispo",
    email: null,
    homepage: "https://users.csc.calpoly.edu/~tmigler/",
    concepts: [
      { name: "graph theory", score: 0.78 },
      { name: "algorithms", score: 0.64 },
      { name: "discrete mathematics", score: 0.42 },
    ],
    recentPapers: [
      {
        title: "Linear-time isomorphism for caterpillar graphs via canonical encodings",
        year: 2024,
        abstract:
          "We present a linear-time algorithm for testing isomorphism of caterpillar graphs using a canonical encoding scheme. The construction extends to broader classes of bounded-treewidth graphs and has practical implications for graph-database indexing.",
        url: "https://example.org/papers/caterpillar-iso",
      },
      {
        title: "On treewidth-preserving graph compression",
        year: 2023,
        abstract:
          "We study lossless graph compression schemes that preserve treewidth bounds. Our approach combines tree decomposition with a novel encoding for vertex subsets and shows competitive ratios on real-world graph datasets.",
        url: "https://example.org/papers/treewidth-compress",
      },
    ],
    matchScore: 0.72,
  },
  {
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
      {
        title: "Trustworthy ML through verifiable program synthesis",
        year: 2023,
        abstract:
          "We argue that program synthesis with formal contracts provides a viable path toward trustworthy ML systems. We sketch a research agenda and report progress on synthesizing safety monitors for learned controllers.",
        url: "https://example.org/papers/trustworthy-ml",
      },
    ],
    matchScore: 0.84,
  },
  {
    id: "fixture_ucla_1",
    name: "Dr. Yuanyuan Zhou",
    affiliation: "UCLA",
    email: null,
    homepage: null,
    concepts: [
      { name: "operating systems", score: 0.69 },
      { name: "reliability", score: 0.55 },
      { name: "concurrency", score: 0.48 },
    ],
    recentPapers: [
      {
        title: "Detecting silent semantic corruption in large-scale storage systems",
        year: 2024,
        abstract:
          "Silent data corruption in modern storage stacks is increasingly common but rarely detected by existing checksums. We propose a runtime invariant-checking layer that catches semantic corruptions with negligible overhead.",
        url: "https://example.org/papers/silent-corruption",
      },
    ],
    matchScore: 0.55,
  },
]

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
    throw new Error(
      `tone extractor truncated by max_tokens cap; result is unusable.`,
    )
  }
  if (response.stop_reason === "refusal") {
    throw new Error(`tone extractor refused; cannot extract from this sample.`)
  }

  for (const block of response.content) {
    if (block.type === "tool_use" && block.name === TONE_PROFILE_TOOL.name) {
      return ExtractedTonePhrasesSchema.parse(block.input)
    }
  }
  throw new Error(
    `tone extractor did not return a tool_use block; stop_reason=${response.stop_reason}`,
  )
}

async function streamDraftEmail(input: DraftEmailInput): Promise<EmailDraft> {
  const stream = client.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 1500,
    system: buildDraftEmailSystem(input),
    tools: [EMAIL_DRAFT_TOOL as unknown as Anthropic.Messages.Tool],
    tool_choice: { type: "tool", name: EMAIL_DRAFT_TOOL.name },
    messages: [{ role: "user", content: buildDraftEmailUserMessage(input) }],
  })

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "input_json_delta"
    ) {
      process.stdout.write(event.delta.partial_json)
    }
  }
  console.log()

  const finalMessage = await stream.finalMessage()

  if (finalMessage.stop_reason === "max_tokens") {
    throw new Error(
      `email writer truncated by max_tokens cap; tool_use JSON is incomplete. Bump max_tokens or shorten the email.`,
    )
  }
  if (finalMessage.stop_reason === "refusal") {
    throw new Error(`email writer refused; cannot draft for this input.`)
  }

  for (const block of finalMessage.content) {
    if (block.type === "tool_use" && block.name === EMAIL_DRAFT_TOOL.name) {
      return EmailDraftSchema.parse(block.input)
    }
  }
  throw new Error(
    `email writer did not return a tool_use block; stop_reason=${finalMessage.stop_reason}`,
  )
}

async function main() {
  console.log("=".repeat(72))
  console.log("ioia end-to-end smoke test")
  console.log("=".repeat(72))
  console.log("Press enter to accept defaults shown in [brackets].")
  console.log()

  // 1. writing sample
  console.log("--- WRITING SAMPLE ---")
  const useDefault = (await ask("Use default writing sample? (y/n)", "y")).toLowerCase()
  const sample =
    useDefault === "n" ? await askMultiline("Paste your writing sample:") : DEFAULT_WRITING_SAMPLE
  console.log()

  // 2. user profile fields
  console.log("--- USER PROFILE ---")
  const fullName = await ask("Full name", "Sid Balaji")
  const university = await ask("University", "California Polytechnic State University, San Luis Obispo")
  const major = await ask("Major", "Computer Science")
  const gpaRaw = await ask("GPA (or blank)", "3.7")
  const gpaParsed = parseFloat(gpaRaw)
  const gpa = Number.isFinite(gpaParsed) ? gpaParsed : null
  const interestsStr = await ask("Research interests (comma-separated)", "program synthesis, distributed systems")
  const researchInterests = interestsStr.split(",").map(s => s.trim()).filter(Boolean)
  const shortBio = await ask("Short bio (one line)", "CS junior at Cal Poly, focused on systems and verification. Looking for a research role for fall 2026.")
  console.log()

  // 3. experience — type your own (blank title skips this block entirely)
  console.log("--- EXPERIENCE (type your own; blank title skips) ---")
  const expTitle = await ask("Experience title (blank to skip)", "Software Engineering Intern")
  const experienceArr: ExperienceItem[] = []
  if (expTitle.trim()) {
    const expOrg = await ask("Organization", "Stripe")
    const expDescription = await askMultiline("Description (1–3 sentences):")
    experienceArr.push({
      title: expTitle.trim(),
      org: expOrg,
      description: expDescription,
    })
  }
  console.log()

  // 4. style and tone (user-selected, not extracted)
  console.log("--- STYLE & TONE ---")
  const voice: ToneVoice = await pickOne("Voice", TONE_VOICES, 0)
  const length: ToneLength = await pickOne("Email length", TONE_LENGTHS, 1)
  const traits: ToneTrait[] = await pickMany(
    "Writing traits",
    TONE_TRAITS,
    ["mentions_specific_paper", "asks_genuine_question", "avoids_buzzwords"],
  )
  console.log()

  // 5. professor
  console.log("--- TARGET PROFESSOR ---")
  PROFESSORS.forEach((p, i) => {
    const concepts = p.concepts.slice(0, 3).map(c => c.name).join(", ")
    console.log(`  ${i + 1}. ${p.name} (${p.affiliation}) — ${concepts}`)
  })
  const profPickStr = await ask("Pick (1-3)", "2")
  const profIdx = Math.max(0, Math.min(PROFESSORS.length - 1, parseInt(profPickStr, 10) - 1))
  const professor = PROFESSORS[profIdx]
  console.log()

  // 6. opportunity
  const oppRaw = (await ask("Opportunity type (research/internship)", "research")).toLowerCase()
  const opportunity: OpportunityType = oppRaw === "internship" ? "internship" : "research"

  // 7. optional notes
  const userNotesRaw = await ask("Optional notes for the writer (blank for none)", "")
  const userNotes = userNotesRaw.trim() || undefined
  console.log()

  rl.close()

  // 7b. Pre-flight: refuse to draft when the user profile is too sparse to anchor an email.
  //     This must run BEFORE any API call so we don't burn a Haiku call on a doomed input.
  assertDraftEmailInputViable({
    experience: experienceArr,
    researchInterests,
  })

  // 8. extract tone phrases
  console.log("=".repeat(72))
  console.log("Step 1: extracting phrasing patterns from writing sample (Haiku)…")
  console.log("=".repeat(72))
  const phrases = await extractTonePhrases(sample)
  console.log(JSON.stringify(phrases, null, 2))
  console.log()

  // 9. compose full ToneProfile (user-selected + extracted)
  const tone: ToneProfile = {
    voice,
    length,
    traits,
    ...phrases,
  }

  // 10. compose user profile
  const user: UserProfile = {
    fullName,
    university,
    major,
    gpa,
    researchInterests,
    shortBio,
    experience: experienceArr,
    tone,
  }

  // 11. draft email
  console.log("=".repeat(72))
  console.log("Step 2: drafting email (Sonnet, streaming)…")
  console.log("=".repeat(72))
  const draft = await streamDraftEmail({ user, professor, opportunity, userNotes })

  // 12. final draft pretty-print
  console.log()
  console.log("=".repeat(72))
  console.log("Final EmailDraft:")
  console.log("=".repeat(72))
  console.log(`Subject:    ${draft.subject}`)
  console.log(`Confidence: ${draft.confidence}`)
  if (draft.warnings.length > 0) {
    console.log(`Warnings:`)
    for (const w of draft.warnings) console.log(`  - ${w}`)
  }
  console.log()
  console.log("Body:")
  console.log("-".repeat(72))
  console.log(draft.body)
  console.log("-".repeat(72))
  console.log()
  console.log("Citations:")
  for (const c of draft.citations) {
    console.log(`  [${c.source}] "${c.claim}" — ${c.ref}`)
  }
  console.log()

  // 13. mailto preview
  if (professor.email) {
    const url = `mailto:${professor.email}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`
    console.log("mailto:")
    console.log(url)
  } else {
    console.log("Professor email is null — UI would prompt the user to find it before sending.")
  }
}

main().catch(err => {
  console.error("\n[error]", err)
  process.exit(1)
})
