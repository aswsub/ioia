import { z } from "zod"
import {
  TONE_VOICES,
  TONE_LENGTHS,
  TONE_TRAITS,
  TONE_CONFIDENCE,
} from "./prompts/tone"
import type { UserProfile } from "./prompts/context"

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

const NoDashCharsSchema = z.string().refine(value => !/[—–]/.test(value), {
  message: "email subject/body must not contain em dash or en dash characters",
})

const EmailSubjectSchema = NoDashCharsSchema.min(4).max(120)
const EmailBodySchema = NoDashCharsSchema.min(50).max(1500).refine(
  value =>
    ![
      "I hope this email finds you well",
      "I am reaching out because",
      "I would love the opportunity to",
      "Please let me know if",
    ].some(phrase => value.toLowerCase().includes(phrase.toLowerCase())),
  { message: "email body contains a banned cold-email phrase" },
)

// What the Sonnet email writer returns via forced tool call.
export const EmailDraftSchema = z.object({
  subject: EmailSubjectSchema,
  body: EmailBodySchema,
  citations: z.array(CitationSchema).max(8),
  confidence: z.enum(["low", "medium", "high"]),
  warnings: z.array(z.string().min(2).max(200)).max(6),
})

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
