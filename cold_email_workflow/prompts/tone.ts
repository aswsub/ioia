// User-selected enums (come from the frontend's tone / length / traits pickers).
export const TONE_VOICES = [
  "conversational",
  "formal",
  "direct",
  "enthusiastic",
  "humble",
] as const
export const TONE_LENGTHS = ["concise", "moderate", "detailed"] as const
export const TONE_TRAITS = [
  "mentions_specific_paper",
  "asks_genuine_question",
  "references_shared_interest",
  "avoids_buzzwords",
  "uses_first_name",
  "mentions_career_goals",
  "keeps_it_personal",
  "data_driven_language",
] as const

// Extracted from the writing sample (Haiku extractor fills these).
export const TONE_CONFIDENCE = ["low", "medium", "high"] as const

export type ToneVoice = (typeof TONE_VOICES)[number]
export type ToneLength = (typeof TONE_LENGTHS)[number]
export type ToneTrait = (typeof TONE_TRAITS)[number]
export type ToneConfidence = (typeof TONE_CONFIDENCE)[number]

export type ToneProfile = {
  // user-selected (frontend)
  voice: ToneVoice
  length: ToneLength
  traits: ToneTrait[]
  // extracted (writing sample)
  signaturePhrases: string[]
  avoidPhrases: string[]
  confidence: ToneConfidence
}

const VOICE: Record<ToneVoice, string> = {
  conversational:
    "Voice: conversational. Sound like a thoughtful student speaking plainly. Plain word choice. Contractions are natural. Avoid sounding like a cover letter.",
  formal:
    "Voice: formal. Complete sentences, measured phrasing, no slang, no contractions. Sound like a person, not a legal brief.",
  direct:
    "Voice: direct. Short sentences. Get to the point fast. State things as claims. No throat-clearing, no unnecessary qualifiers, no preambles. The ask is one sentence.",
  enthusiastic:
    "Voice: enthusiastic. Show genuine curiosity and energy in word choice. Contractions are natural. Etiquette caps exclamation points at one; do not exceed that.",
  humble:
    "Voice: humble. Frame your own contribution modestly without false modesty. Light hedging is OK ('it seems,' 'I think'). Do NOT hedge the ask itself; it must still be direct.",
}

const LENGTH: Record<ToneLength, string> = {
  concise:
    "Length preference: concise. Aim for the lower end of the etiquette cap. Two short paragraphs. Cut anything that does not earn its place.",
  moderate:
    "Length preference: moderate. Use the middle of the etiquette cap. Three short paragraphs is a good shape.",
  detailed:
    "Length preference: detailed. Approach the etiquette cap, do not exceed it. Every sentence still earns its place; do not pad.",
}

const TRAIT: Record<ToneTrait, string> = {
  mentions_specific_paper:
    "Reference one specific recent paper by title with a concrete idea you took from it (already required by etiquette; do it well).",
  asks_genuine_question:
    "Include one genuine question about the professor's work that you would actually want to discuss in person. The question must be specific and tied to the cited paper or concept.",
  references_shared_interest:
    "Explicitly name one research concept or topic that connects the user's interests to the professor's work. Drawn from CONTEXT only.",
  avoids_buzzwords:
    "Strictly avoid 'leverage,' 'synergize,' 'cutting-edge,' 'paradigm-shifting,' 'state-of-the-art,' 'innovative,' 'passionate.'",
  uses_first_name:
    "Address the professor by first name in the greeting (e.g. 'Hi Sanjit,' instead of 'Dear Professor Seshia,'). Override the etiquette greeting rule for this email only. The signature still uses the user's full name per etiquette.",
  mentions_career_goals:
    "Include one short sentence on career intent (PhD, industry research, the field the user wants to enter), drawn from CONTEXT.shortBio or CONTEXT.researchInterests. Do NOT invent goals.",
  keeps_it_personal:
    "Lean on first-person voice and concrete personal stakes. Avoid passive voice and impersonal framing.",
  data_driven_language:
    "Include at least one concrete number, metric, or measurable outcome from the user's experience (lines of code, users served, latency, dataset size, etc.). Skip if the user's experience does not provide one; do NOT invent metrics.",
}

const CONFIDENCE: Record<ToneConfidence, string> = {
  high:
    "Tone-extraction confidence: high. The signature and avoid phrases below are reliable; mirror them while still following the etiquette block.",
  medium:
    "Tone-extraction confidence: medium. Use the signature and avoid phrases below lightly and prioritize clear, natural professor outreach.",
  low:
    "Tone-extraction confidence: low. Treat the signature and avoid phrases below as weak signals; lean on the user-selected voice, length, and traits above and a neutral, professional student voice.",
}

function bullets(items: string[]): string {
  return items.map(item => `  - ${item}`).join("\n")
}

export function renderToneBlock(tone: ToneProfile): string {
  const sections: string[] = [
    "TONE: MIRROR THE USER'S VOICE.",
    "When the tone block conflicts with the etiquette block, the etiquette block wins, EXCEPT where a user-selected trait below explicitly overrides a specific etiquette rule.",
    "",
    VOICE[tone.voice],
    LENGTH[tone.length],
  ]

  if (tone.traits.length > 0) {
    sections.push(
      "",
      "Writing traits the user selected, incorporate these where natural:",
      tone.traits.map(t => `  - ${TRAIT[t]}`).join("\n"),
    )
  }

  sections.push("", CONFIDENCE[tone.confidence])

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
