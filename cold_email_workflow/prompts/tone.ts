export const TONE_FORMALITIES = ["casual", "neutral", "formal"] as const
export const TONE_SENTENCE_LENGTHS = ["short", "medium", "long"] as const
export const TONE_CONTRACTIONS = ["uses", "avoids", "unknown"] as const
export const TONE_HEDGING = ["low", "medium", "high"] as const
export const TONE_CONFIDENCE = ["low", "medium", "high"] as const

export type ToneProfile = {
  formality: (typeof TONE_FORMALITIES)[number]
  sentenceLength: (typeof TONE_SENTENCE_LENGTHS)[number]
  contractions: (typeof TONE_CONTRACTIONS)[number]
  hedging: (typeof TONE_HEDGING)[number]
  confidence: (typeof TONE_CONFIDENCE)[number]
  signaturePhrases: string[]
  avoidPhrases: string[]
}

const FORMALITY: Record<ToneProfile["formality"], string> = {
  casual:
    "Register: casual but not sloppy. Greet 'Hi Professor [LastName],'. Allow plain phrasing like 'I built,' 'I want to,' 'I noticed.' Should sound like a thoughtful student talking, not a cover letter.",
  neutral:
    "Register: neutral. Greet 'Hi Professor [LastName],' or 'Dear Professor [LastName],' — pick whichever fits the rest of the tone block. Professional but not stiff.",
  formal:
    "Register: formal. Greet 'Dear Professor [LastName],'. Complete sentences, no slang, measured phrasing. Still sound like a person, not a legal brief.",
}

const SENTENCE_LENGTH: Record<ToneProfile["sentenceLength"], string> = {
  short:
    "Sentence length: short. Average 8 to 14 words. One idea per sentence. Vary, but lean short.",
  medium:
    "Sentence length: medium. Average 14 to 20 words. Mix short and longer sentences, but prefer clarity over flow.",
  long:
    "Sentence length: long. Average 20 to 28 words. Develop one thought per sentence with a subordinate clause. Do not chain ideas with commas just to lengthen.",
}

const HEDGING: Record<ToneProfile["hedging"], string> = {
  low:
    "Hedging: low. State things as claims. Banned: 'I think,' 'maybe,' 'I just,' 'kind of,' 'sort of,' 'I was wondering if.'",
  medium:
    "Hedging: medium. One soft phrase like 'I think' or 'it seems' is allowed in the connection paragraph only. Nowhere else.",
  high:
    "Hedging: high. Soften claims about the professor's work and your own with 'it seems,' 'I might,' 'I am curious whether.' The ask itself must still be direct — do not hedge the ask.",
}

const CONTRACTIONS: Record<ToneProfile["contractions"], string> = {
  uses:
    "Contractions: yes. Use 'I'm,' 'don't,' 'it's,' 'I've' naturally. Avoid only when they create awkwardness.",
  avoids:
    "Contractions: no. Write 'I am,' 'do not,' 'it is,' 'I have.'",
  unknown:
    "Contractions: unknown. Use natural professional defaults; contractions are allowed if they keep the email from sounding stiff.",
}

const CONFIDENCE: Record<ToneProfile["confidence"], string> = {
  high:
    "Tone confidence: high. Mirror these traits, while still following the etiquette block.",
  medium:
    "Tone confidence: medium. Use these traits lightly and prioritize clear, natural professor outreach.",
  low:
    "Tone confidence: low. The sample is weak evidence of voice, so use the neutral fallback below instead of the inferred traits.",
}

const LOW_CONFIDENCE_FALLBACK = [
  "Fallback tone: neutral, professional student voice.",
  "Greet 'Hi Professor [LastName],' or 'Dear Professor [LastName],'.",
  "Use medium-length sentences, plain wording, and natural contractions only when they keep the email from sounding stiff.",
  "Keep the ask direct, and do not overfit signature phrases, slang, or formatting from the sample.",
].join("\n")

function bullets(items: string[]): string {
  return items.map(item => `  - ${item}`).join("\n")
}

export function renderToneBlock(tone: ToneProfile): string {
  const sections: string[] = [
    "TONE — MIRROR THE USER'S VOICE.",
    "When the tone block conflicts with the etiquette block, the etiquette block wins. Tone controls HOW the user sounds, not whether the hard rules apply.",
    "",
    CONFIDENCE[tone.confidence],
  ]

  if (tone.confidence === "low") {
    sections.push(LOW_CONFIDENCE_FALLBACK)
    return sections.join("\n")
  }

  sections.push(
    FORMALITY[tone.formality],
    SENTENCE_LENGTH[tone.sentenceLength],
    CONTRACTIONS[tone.contractions],
    HEDGING[tone.hedging],
  )

  if (tone.signaturePhrases.length > 0) {
    sections.push(
      "",
      "Phrases the user actually writes. Mirror the cadence and word choice, but do not paste them verbatim unless they fit naturally:",
      bullets(tone.signaturePhrases),
    )
  }

  if (tone.avoidPhrases.length > 0) {
    sections.push(
      "",
      "Phrases the user would never write. Do NOT use these or close paraphrases:",
      bullets(tone.avoidPhrases),
    )
  }

  return sections.join("\n")
}
