import { z } from "zod"
import {
  TONE_VOICES,
  TONE_LENGTHS,
  TONE_TRAITS,
  TONE_CONFIDENCE,
} from "./prompts/tone"
import type { Professor, UserProfile } from "./prompts/context"

// Runtime validation at model-output boundaries.
// Type definitions live in prompts/* and tests/* — keep them in sync with these schemas.
// When `lib/schemas/` lands per CLAUDE.md, lift this file there and import it from both sides.

// What the Haiku tone extractor returns.
export const ExtractedTonePhrasesSchema = z.object({
  signaturePhrases: z.array(z.string().min(2).max(80)).max(5),
  avoidPhrases: z.array(z.string().min(2).max(80)).max(5),
  confidence: z.enum(TONE_CONFIDENCE),
})

// Full ToneProfile = user-selected (frontend) + extracted (Haiku).
export const ToneProfileSchema = ExtractedTonePhrasesSchema.extend({
  voice: z.enum(TONE_VOICES),
  length: z.enum(TONE_LENGTHS),
  traits: z.array(z.enum(TONE_TRAITS)),
})

export const CitationSchema = z.object({
  claim: z.string().min(3).max(500),
  source: z.enum(["paper", "homepage", "profile"]),
  ref: z.string().min(2).max(500),
})

// Em-dash / en-dash handling is two-layered:
//   1. The prompt (etiquette + VOICE REALISM + OUTPUT_FIELDS + user message)
//      tells the model never to emit them. They're a known AI tell.
//   2. This schema preprocesses the model's output: if a dash slips through,
//      we silently substitute (em -> comma+space, en -> hyphen) and log a
//      warning. The refine below stays as a tripwire that should never fire.
//
// We sanitize rather than reject because a dash slip would fatally crash the
// demo, and the model occasionally slips despite multiple reminders. Watch
// the console for "[note] sanitized" warnings to gauge how often the prompt
// needs tightening.
function sanitizeDashChars(value: unknown): unknown {
  if (typeof value !== "string" || !/[—–]/.test(value)) return value
  console.warn(
    "[note] model emitted em/en dash characters; sanitized at schema boundary.",
  )
  // Em-dash: collapse any surrounding whitespace so " — " becomes ", " not " ,  ".
  // En-dash (typically used in numeric ranges like "3–5"): just to a hyphen.
  return value.replace(/\s*—\s*/g, ", ").replace(/–/g, "-")
}

const dashTripwire = (value: string): boolean => !/[—–]/.test(value)
const dashTripwireMessage =
  "em/en dash sanitization failed: schema preprocess did not catch all dash characters."

const EmailSubjectSchema = z.preprocess(
  sanitizeDashChars,
  z.string().min(4).max(120).refine(dashTripwire, { message: dashTripwireMessage }),
)

const EmailBodySchema = z.preprocess(
  sanitizeDashChars,
  z
    .string()
    .min(50)
    .max(1500)
    .refine(dashTripwire, { message: dashTripwireMessage })
    .refine(
      value =>
        ![
          "I hope this email finds you well",
          "I am reaching out because",
          "I would love the opportunity to",
          "Please let me know if",
        ].some(phrase => value.toLowerCase().includes(phrase.toLowerCase())),
      { message: "email body contains a banned cold-email phrase" },
    ),
)

// What the Sonnet email writer returns via forced tool call.
export const EmailDraftSchema = z.object({
  subject: EmailSubjectSchema,
  body: EmailBodySchema,
  citations: z.array(CitationSchema).max(8),
  confidence: z.enum(["low", "medium", "high"]),
  warnings: z.array(z.string().min(2).max(200)).max(6),
})

// ============================================================================
// Internship-side data shapes.
//
// Research outreach uses a Professor + recentPapers shape. Internship outreach
// uses a Company (with notableWork: blog posts/launches/talks) plus a specific
// CompanyContact (a recruiter or an IC). Seed data lives in data/seed/companies.json.
// ============================================================================

export const CompanyContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(), // "Recruiter, University", "Senior SWE, Sync Team"
  email: z.string().email(),
  linkedin: z.string().url().nullable(),
})

export const NotableWorkSchema = z.object({
  title: z.string(),
  type: z.enum(["blog", "talk", "launch", "repo", "product"]),
  url: z.string().url(),
  summary: z.string(), // 1-2 sentences for the model to reference
  // Full name of the individual author when the artifact has a known byline
  // (a specific blog post, talk, or technical writeup). Null for company-level
  // artifacts (product pages, generic launch announcements, team-authored
  // engineering posts without a single byline). Critical for the writer's
  // hook: implying the recipient authored work they did not is an immediate
  // credibility kill — the prompt branches on this field.
  author: z.string().nullable(),
})

export const CompanySchema = z.object({
  id: z.string(), // "linear", "vercel", "ramp"
  name: z.string(), // "Linear"
  domain: z.string(), // "linear.app"
  blurb: z.string(), // one-line description of what they do
  notableWork: z.array(NotableWorkSchema).min(1).max(5),
  teams: z.array(z.string()), // ["Sync Engine", "Mobile", "API Platform"]
  contacts: z.array(CompanyContactSchema).min(1),
})

export type Company = z.infer<typeof CompanySchema>
export type CompanyContact = z.infer<typeof CompanyContactSchema>
export type NotableWork = z.infer<typeof NotableWorkSchema>

// ============================================================================
// Discriminated input to the email writer.
//
// `target.kind` selects between the research path (professor + recent papers,
// uses RESEARCH_ETIQUETTE, includes interest declaration) and the internship
// path (company + contact + notable work, uses INTERNSHIP_ETIQUETTE, no
// interest declaration).
//
// User and Professor are referenced via z.custom because they're complex TS
// types in prompts/context.ts and there's no untrusted-input boundary right
// now. If we ever take JSON across the wire, schematize them properly.
// ============================================================================

const ResearchTargetSchema = z.object({
  kind: z.literal("research"),
  professor: z.custom<Professor>(),
})

const InternshipTargetSchema = z.object({
  kind: z.literal("internship"),
  company: CompanySchema,
  contact: CompanyContactSchema,
  teamFocus: z.string().optional(), // e.g. "Sync Engine" if user picked a team
})

export const DraftEmailTargetSchema = z.discriminatedUnion("kind", [
  ResearchTargetSchema,
  InternshipTargetSchema,
])

export const DraftEmailInputSchema = z.object({
  user: z.custom<UserProfile>(),
  target: DraftEmailTargetSchema,
  userNotes: z.string().optional(),
})

export type DraftEmailInput = z.infer<typeof DraftEmailInputSchema>
export type DraftEmailTarget = z.infer<typeof DraftEmailTargetSchema>

export class DraftEmailInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DraftEmailInputError"
  }
}

/**
 * Pre-flight check: refuse to call the email writer when the user profile is
 * too sparse to anchor an email.
 *
 * The connection paragraph requires either a concrete experience item OR a
 * stated research interest — without at least one, the writer has nothing to
 * tie the user to the professor and would have to invent specificity.
 *
 * Soft cases (experience empty but interests/bio present) fall through to
 * the in-prompt fallback in renderContextBlock; this function only catches
 * the hard case where there is nothing to draft from.
 */
export function assertDraftEmailInputViable(
  user: Pick<UserProfile, "experience" | "researchInterests">,
): void {
  if (user.experience.length === 0 && user.researchInterests.length === 0) {
    throw new DraftEmailInputError(
      "Cannot draft a cold email: user has no experience items AND no research interests. " +
        "The connection paragraph requires at least one anchor. " +
        "Populate either field before calling the writer.",
    )
  }
}
