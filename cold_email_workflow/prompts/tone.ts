export type ToneProfile = {
  formality: "casual" | "neutral" | "formal"
  sentenceLength: "short" | "medium" | "long"
  contractions: boolean
  hedging: "low" | "medium" | "high"
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
    "Hedging: high. Soften claims about the professor's work and your own with 'it seems,' 'I might,' 'I'm curious whether.' The ask itself must still be direct — do not hedge the ask.",
}

function bullets(items: string[]): string {
  return items.map(item => `  - ${item}`).join("\n")
}

export function renderToneBlock(tone: ToneProfile): string {
  const sections: string[] = [
    "TONE — MIRROR THE USER'S VOICE.",
    "When the tone block conflicts with the etiquette block, the etiquette block wins. Tone controls HOW the user sounds, not whether the hard rules apply.",
    "",
    FORMALITY[tone.formality],
    SENTENCE_LENGTH[tone.sentenceLength],
    tone.contractions
      ? "Contractions: yes. Use 'I'm,' 'don't,' 'it's,' 'I've' naturally. Avoid only when they create awkwardness."
      : "Contractions: no. Write 'I am,' 'do not,' 'it is,' 'I have.'",
    HEDGING[tone.hedging],
  ]

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
