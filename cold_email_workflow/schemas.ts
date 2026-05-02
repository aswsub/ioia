import { z } from "zod"
import {
  TONE_VOICES,
  TONE_LENGTHS,
  TONE_TRAITS,
  TONE_CONFIDENCE,
} from "./prompts/tone"

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

// What the Sonnet email writer returns via forced tool call.
export const EmailDraftSchema = z.object({
  subject: z.string().min(4).max(120),
  body: z.string().min(50).max(1500),
  citations: z.array(CitationSchema).max(8),
  confidence: z.enum(["low", "medium", "high"]),
  warnings: z.array(z.string().min(2).max(200)).max(6),
})
